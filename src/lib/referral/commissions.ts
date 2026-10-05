import "server-only";
import type { Prisma } from "@prisma/client";
import { ELIGIBLE_DOCUMENT_TYPES, REFERRAL_COMMISSION_FCFA } from "./config";

/**
 * Commission de parrainage pour un paiement qui VIENT d'être confirmé.
 * Appelée uniquement dans la transaction qui fait passer le paiement de
 * PENDING à SUCCESS (src/lib/payment/settle.ts), jamais depuis le
 * navigateur. Aucune commission si :
 *  - le document n'est pas éligible (CV et lettres seulement) ou est un
 *    document de l'espace Pro (abonnement, pas un achat à l'unité) ;
 *  - l'acheteur n'a pas de parrain, ou s'est « parrainé » lui-même ;
 *  - une commission existe déjà pour ce paiement (paymentId unique en base :
 *    une confirmation répétée ne crédite jamais deux fois).
 */
export async function recordReferralCommission(tx: Prisma.TransactionClient, paymentId: string) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      status: true,
      document: { select: { type: true, professionalAccountId: true } },
      user: { select: { referredById: true } },
      referralCommission: { select: { id: true } },
    },
  });
  if (!payment || payment.status !== "SUCCESS" || payment.referralCommission) return null;
  const document = payment.document;
  if (!document || document.professionalAccountId) return null;
  if (!(ELIGIBLE_DOCUMENT_TYPES as readonly string[]).includes(document.type)) return null;
  const referrerId = payment.user.referredById;
  if (!referrerId || referrerId === payment.userId) return null;

  return tx.referralCommission.create({
    data: {
      referrerId,
      referredUserId: payment.userId,
      paymentId: payment.id,
      documentType: document.type,
      amountFcfa: REFERRAL_COMMISSION_FCFA,
    },
  });
}
