"use server";

import { prisma } from "@/lib/db/client";
import { getGateway } from "@/lib/payment";
import { refreshPendingPayments } from "@/lib/payment/settle";
import { rateLimit } from "@/lib/security/rate-limit";
import { activateProSubscription, syncProPaymentRecord } from "./billing";
import { getCurrentProAccount } from "./dal";
import { isProEnabled } from "./flag";
import { PRO_STARTER } from "./plans";

export interface ProPaymentResult {
  status: "success" | "pending" | "failed";
  message?: string;
  paymentId?: string;
  /** Page de paiement Notch Pay vers laquelle rediriger. */
  redirectUrl?: string;
  /** Un paiement précédent est en cours de confirmation chez l'opérateur. */
  processing?: boolean;
}

/**
 * Paiement d'une période Pro Starter (CGU Pro, articles 6 à 8). Le compte,
 * l'offre et le montant sont déterminés ici, côté serveur : le navigateur
 * n'envoie que l'accord du professionnel sur le récapitulatif. L'activation
 * n'a lieu qu'à la confirmation du paiement (settlePayment), jamais au
 * simple retour sur le site.
 */
export async function initiateProSubscriptionAction(formData: FormData): Promise<ProPaymentResult> {
  if (!isProEnabled()) return { status: "failed", message: "Service indisponible." };
  const account = await getCurrentProAccount();
  if (!account) return { status: "failed", message: "Session expirée, reconnectez-vous." };
  if (account.status === "SUSPENDED") return { status: "failed", message: "Votre espace professionnel est suspendu." };

  if (formData.get("recap") !== "on") {
    return { status: "failed", message: "Cochez la case pour confirmer avoir lu le récapitulatif et la règle de remboursement." };
  }
  if (!(await rateLimit(`pro-pay:${account.id}`, 10, 15 * 60 * 1000)).allowed) {
    return { status: "failed", message: "Trop de tentatives de paiement. Réessayez dans quelques minutes." };
  }

  // Jamais deux paiements en parallèle : on règle d'abord ceux en attente.
  const { processingPaymentId } = await refreshPendingPayments({ userId: account.userId, kind: "PRO_SUBSCRIPTION" });
  if (processingPaymentId) return { status: "pending", paymentId: processingPaymentId, processing: true };

  const user = await prisma.user.findUnique({ where: { id: account.userId }, select: { email: true } });
  if (!user) return { status: "failed", message: "Session expirée, reconnectez-vous." };

  const payment = await prisma.payment.create({
    data: {
      userId: account.userId,
      kind: "PRO_SUBSCRIPTION",
      professionalAccountId: account.id,
      provider: "NOTCHPAY",
      amountFcfa: PRO_STARTER.priceFcfa,
      status: "PENDING",
    },
  });
  await syncProPaymentRecord(prisma, payment.id);

  const result = await getGateway("NOTCHPAY").initiate({
    provider: "NOTCHPAY",
    amountFcfa: PRO_STARTER.priceFcfa,
    reference: payment.id,
    // Nature du service uniquement, sans donnée de candidat.
    description: `monemploiGo — ${PRO_STARTER.name} (${PRO_STARTER.periodDays} jours)`,
    userId: account.userId,
    email: user.email,
  });

  if (result.status === "success") {
    // Passerelle qui confirme sur-le-champ (mode démo) : mêmes effets que
    // settlePayment.
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "SUCCESS", providerRef: result.providerRef } });
      if (count === 0) return;
      await activateProSubscription(tx, payment.id);
      await syncProPaymentRecord(tx, payment.id);
    });
    return { status: "success", paymentId: payment.id };
  }

  if (result.status === "pending") {
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: result.providerRef } });
    await syncProPaymentRecord(prisma, payment.id);
    return { status: "pending", message: result.message, paymentId: payment.id, redirectUrl: result.redirectUrl };
  }

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  await syncProPaymentRecord(prisma, payment.id);
  return { status: "failed", message: result.message };
}
