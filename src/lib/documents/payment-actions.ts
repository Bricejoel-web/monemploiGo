"use server";

import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getGateway } from "@/lib/payment";
import { PRICE_FCFA, COVER_LETTER_PRICE_FCFA, BEWERBUNGSBRIEF_PRICE_FCFA } from "@/lib/cv/catalog";
import { rateLimit } from "@/lib/security/rate-limit";
import { markDocumentPaid } from "@/lib/documents/retention";
import { recordReferralCommission } from "@/lib/referral/commissions";
import { ABANDON_MIN_AGE_MS, STALE_PROCESSING_MS, refreshPendingPayments, settlePayment } from "@/lib/payment/settle";

export interface PaymentActionResult {
  status: "success" | "pending" | "failed";
  message?: string;
  paymentId?: string;
  /** Présent quand le client doit être redirigé vers une page de paiement externe (CinetPay). */
  redirectUrl?: string;
  /** Un paiement précédent est en cours de confirmation chez l'opérateur. */
  processing?: boolean;
}

const SERVICE_LABELS = {
  STANDARD: "CV Standard",
  PREMIUM: "CV Premium",
  ATS: "CV ATS",
  GERMAN_ATS: "CV Allemagne (ATS)",
  COVER_LETTER: "Lettre de motivation",
  BEWERBUNGSBRIEF: "Bewerbungsbrief",
} as const;

async function getDocumentAmount(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId, professionalAccountId: null },
  });
  if (!document) throw new Error("Document introuvable.");

  const amount =
    document.type === "COVER_LETTER"
      ? COVER_LETTER_PRICE_FCFA
      : document.type === "BEWERBUNGSBRIEF"
        ? BEWERBUNGSBRIEF_PRICE_FCFA
        : PRICE_FCFA[document.category ?? "STANDARD"];
  return { document, amount };
}

// Notch Pay est la passerelle par défaut (2026-09-26, à la demande explicite
// de l'utilisateur) : Monetbil et CinetPay restent implémentés en réserve
// (voir docs/ROADMAP.md) mais ne sont plus utilisés par le parcours réel.
export async function initiatePaymentAction(documentId: string): Promise<PaymentActionResult> {
  const session = await verifySession();
  if (!session) return { status: "failed", message: "Session expirée, reconnectez-vous." };

  if (!rateLimit(`pay:${session.userId}`, 10, 15 * 60 * 1000).allowed) {
    return { status: "failed", message: "Trop de tentatives de paiement. Réessayez dans quelques minutes." };
  }

  const { document, amount } = await getDocumentAmount(documentId, session.userId);

  // Jamais de second paiement pour un même document : un onglet resté
  // ouvert sur la page de paiement proposait encore « Payer » après un
  // paiement réussi ailleurs, et créait un nouveau paiement. On règle
  // d'abord les paiements en attente de ce document auprès de Notch Pay.
  const { processingPaymentId } = await refreshPendingPayments({ userId: session.userId, documentId: document.id });
  const current = await prisma.document.findUnique({ where: { id: document.id }, select: { status: true } });
  if (current?.status === "PAID") return { status: "success" };
  if (processingPaymentId) return { status: "pending", paymentId: processingPaymentId, processing: true };

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  if (!user) return { status: "failed", message: "Session expirée, reconnectez-vous." };

  const payment = await prisma.payment.create({
    data: {
      userId: session.userId,
      documentId: document.id,
      provider: "NOTCHPAY",
      amountFcfa: amount,
      status: "PENDING",
    },
  });

  const gateway = getGateway("NOTCHPAY");
  const result = await gateway.initiate({
    provider: "NOTCHPAY",
    amountFcfa: amount,
    reference: payment.id,
    // Nature du service uniquement : le titre du document contient le nom
    // complet du client, inutile au paiement (minimisation des données
    // transmises à Notch Pay, voir la politique de confidentialité §9).
    description: `monemploiGo — ${SERVICE_LABELS[document.type === "CV" ? (document.category ?? "STANDARD") : document.type]}`,
    userId: session.userId,
    email: user.email,
  });

  if (result.status === "success") {
    // Passerelle qui confirme sur-le-champ (mode démo) : mêmes effets que
    // settlePayment, y compris la commission de parrainage.
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", providerRef: result.providerRef } });
      await markDocumentPaid(document.id, tx);
      await recordReferralCommission(tx, payment.id);
    });
    return { status: "success", paymentId: payment.id };
  }

  if (result.status === "pending") {
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: result.providerRef } });
    return { status: "pending", message: result.message, paymentId: payment.id, redirectUrl: result.redirectUrl };
  }

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  return { status: "failed", message: result.message };
}

/**
 * Le client a annulé sur son téléphone, ou la demande n'est jamais arrivée :
 * il abandonne ce paiement pour en relancer un. Jamais de double débit :
 *   1. on demande à Notch Pay d'annuler la transaction ;
 *   2. on revérifie son statut réel ;
 *   3. s'il a finalement réussi → document débloqué, pas de nouveau paiement ;
 *      s'il est annulé/échoué → nouveau paiement possible tout de suite ;
 *      s'il est encore « en cours » → nouveau paiement possible seulement
 *      après STALE_PROCESSING_MS (la demande au téléphone a alors expiré).
 */
export async function abandonPaymentAction(paymentId: string): Promise<{ status: "canceled" | "success" | "wait"; waitSeconds?: number }> {
  const session = await verifySession();
  if (!session) return { status: "wait" };

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: session.userId } });
  if (!payment || payment.status === "FAILED") return { status: "canceled" };
  if (payment.status === "SUCCESS") return { status: "success" };
  if (!payment.providerRef) return { status: "canceled" };

  const age = Date.now() - payment.createdAt.getTime();
  if (age < ABANDON_MIN_AGE_MS) return { status: "wait", waitSeconds: Math.ceil((ABANDON_MIN_AGE_MS - age) / 1000) };

  const gateway = getGateway(payment.provider);
  const ref = { provider: payment.provider, providerRef: payment.providerRef };
  await gateway.cancel?.(ref);
  await settlePayment(payment, await gateway.checkStatus(ref));

  const after = await prisma.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
  if (after?.status === "SUCCESS") return { status: "success" };
  if (after?.status === "FAILED") return { status: "canceled" };
  if (age >= STALE_PROCESSING_MS) return { status: "canceled" };
  return { status: "wait", waitSeconds: Math.ceil((STALE_PROCESSING_MS - age) / 1000) };
}

export async function checkPaymentStatusAction(paymentId: string): Promise<PaymentActionResult> {
  const session = await verifySession();
  if (!session) return { status: "failed", message: "Session expirée." };

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: session.userId } });
  if (!payment) return { status: "failed", message: "Paiement introuvable." };
  if (payment.status === "SUCCESS") return { status: "success" };
  if (payment.status === "FAILED") return { status: "failed" };
  if (!payment.providerRef) return { status: "pending" };

  const gateway = getGateway(payment.provider);
  const result = await gateway.checkStatus({ provider: payment.provider, providerRef: payment.providerRef });
  await settlePayment(payment, result);

  return { status: result.status === "processing" ? "pending" : result.status };
}
