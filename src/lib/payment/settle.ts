import "server-only";
import { prisma } from "@/lib/db/client";
import { markDocumentPaid } from "@/lib/documents/retention";
import { getGateway } from "./index";
import type { CheckPaymentStatusResult } from "./types";

/** Seule devise acceptée : lancement au Cameroun uniquement (décision du 2026-09-28). */
export const PAYMENT_CURRENCY = "XAF";

export type SettleResult = "paid" | "failed" | "mismatch" | "unchanged";

/**
 * Point unique où un paiement en attente devient réussi ou échoué, quelle
 * que soit la voie par laquelle on l'apprend (webhook, retour sur le site,
 * vérification à l'affichage d'une page, purge quotidienne) : toutes
 * appliquent donc exactement les mêmes contrôles.
 *
 * Un paiement n'est accepté que si le montant payé est exactement celui que
 * nous avions demandé, en XAF. Le montant est obligatoire (Notch Pay le
 * renvoie toujours) ; la devise, si elle est absente, est celle de
 * l'initialisation (toujours XAF). Une passerelle qui ne renverrait pas le
 * montant (Monetbil/CinetPay, en réserve) verrait ses paiements refusés :
 * à adapter avant de la réactiver.
 */
export async function settlePayment(
  payment: { id: string; documentId: string | null; status: string; amountFcfa: number },
  outcome: CheckPaymentStatusResult,
): Promise<SettleResult> {
  if (payment.status !== "PENDING") return "unchanged";

  if (outcome.status === "success") {
    const amountOk = outcome.amount === payment.amountFcfa;
    const currencyOk = !outcome.currency || outcome.currency === PAYMENT_CURRENCY;
    if (!amountOk || !currencyOk) {
      console.error("[paiement] montant/devise incohérents : paiement refusé", payment.id, {
        attendu: `${payment.amountFcfa} ${PAYMENT_CURRENCY}`,
        recu: `${outcome.amount} ${outcome.currency ?? "?"}`,
      });
      return (await leavePending(payment.id, "FAILED")) ? "mismatch" : "unchanged";
    }
    // Transition unique : plusieurs confirmations du même paiement peuvent
    // arriver en même temps (webhook + retour sur le site + vérification à
    // l'affichage). Elles lisaient toutes "PENDING" puis validaient toutes
    // (6 validations pour 6 confirmations simultanées, mesuré). Désormais,
    // seule celle qui fait réellement passer le paiement de PENDING à
    // SUCCESS débloque le document, dans la même transaction.
    const paid = await prisma.$transaction(async (tx) => {
      const { count } = await tx.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "SUCCESS" } });
      if (count === 0) return false;
      if (payment.documentId) await markDocumentPaid(payment.documentId, tx);
      return true;
    });
    return paid ? "paid" : "unchanged";
  }

  if (outcome.status === "failed") {
    return (await leavePending(payment.id, "FAILED")) ? "failed" : "unchanged";
  }

  return "unchanged";
}

/** Sort un paiement de l'état PENDING, seulement s'il y est encore. */
async function leavePending(paymentId: string, status: "FAILED"): Promise<boolean> {
  const { count } = await prisma.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status } });
  return count === 1;
}

/** Au-delà, une transaction non validée a forcément expiré chez l'opérateur. */
const RECENT_PENDING_MS = 48 * 60 * 60 * 1000;

/**
 * Délai avant de proposer d'abandonner un paiement : le client doit avoir eu
 * le temps de valider la demande reçue sur son téléphone.
 */
export const ABANDON_MIN_AGE_MS = 2 * 60 * 1000;

/**
 * Au-delà, un paiement « en cours » ne bloque plus un nouveau paiement : la
 * demande Mobile Money envoyée au téléphone a expiré depuis longtemps, mais
 * Notch Pay peut mettre des heures à passer la transaction en « échouée »
 * (mesuré le 2026-09-29 : abandon à 10 h 39, « échoué » à 14 h 40). Sans
 * cette limite, un client qui avait annulé restait bloqué sur « paiement en
 * attente, inutile de payer à nouveau ».
 */
export const STALE_PROCESSING_MS = 10 * 60 * 1000;

/**
 * Interroge la passerelle pour les paiements encore "en attente" et les
 * règle. Indispensable tant que le webhook Notch Pay ne se déclenche pas :
 * sans cela, un client qui a payé mais n'est pas revenu sur la page de retour
 * (application Mobile Money qui ouvre un autre navigateur, session expirée,
 * page fermée...) restait "en attente" pour toujours, sans son document, et
 * se voyait proposer de payer une seconde fois.
 *
 * Renvoie l'identifiant du paiement le plus récent encore en cours de
 * confirmation chez l'opérateur, s'il y en a un : pendant ce temps, on ne
 * propose pas de repayer.
 */
export async function refreshPendingPayments(filter: { userId?: string; documentId?: string; limit?: number }): Promise<{ processingPaymentId?: string; processingSince?: string }> {
  const pending = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      providerRef: { not: null },
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.documentId ? { documentId: filter.documentId } : {}),
      ...(filter.userId || filter.documentId ? { createdAt: { gte: new Date(Date.now() - RECENT_PENDING_MS) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filter.limit ?? 5,
  });

  let processingPaymentId: string | undefined;
  let processingSince: string | undefined;
  for (const payment of pending) {
    const outcome = await getGateway(payment.provider).checkStatus({ provider: payment.provider, providerRef: payment.providerRef! });
    await settlePayment(payment, outcome);
    const recent = Date.now() - payment.createdAt.getTime() < STALE_PROCESSING_MS;
    if (outcome.status === "processing" && recent && !processingPaymentId) {
      processingPaymentId = payment.id;
      processingSince = payment.createdAt.toISOString();
    }
  }
  return { processingPaymentId, processingSince };
}
