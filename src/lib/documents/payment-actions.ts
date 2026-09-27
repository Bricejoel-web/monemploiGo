"use server";

import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getGateway } from "@/lib/payment";
import { PRICE_FCFA, COVER_LETTER_PRICE_FCFA, BEWERBUNGSBRIEF_PRICE_FCFA } from "@/lib/cv/catalog";
import { rateLimit } from "@/lib/security/rate-limit";
import { markDocumentPaid } from "@/lib/documents/retention";

export interface PaymentActionResult {
  status: "success" | "pending" | "failed";
  message?: string;
  paymentId?: string;
  /** Présent quand le client doit être redirigé vers une page de paiement externe (CinetPay). */
  redirectUrl?: string;
}

async function getDocumentAmount(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
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
    description: `monemploiGo — ${document.title}`,
    userId: session.userId,
    email: user.email,
  });

  if (result.status === "success") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", providerRef: result.providerRef } }),
      markDocumentPaid(document.id),
    ]);
    return { status: "success", paymentId: payment.id };
  }

  if (result.status === "pending") {
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: result.providerRef } });
    return { status: "pending", message: result.message, paymentId: payment.id, redirectUrl: result.redirectUrl };
  }

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  return { status: "failed", message: result.message };
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

  if (result.status === "success") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS" } }),
      ...(payment.documentId ? [markDocumentPaid(payment.documentId)] : []),
    ]);
  } else if (result.status === "failed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  return { status: result.status };
}
