import "server-only";
import { prisma } from "@/lib/db/client";
import { markDocumentPaid } from "@/lib/documents/retention";
import { getGateway } from "./index";
import type { CheckPaymentStatusResult } from "./types";

/**
 * Point unique où un paiement en attente devient réussi ou échoué, quelle
 * que soit la voie par laquelle on l'apprend (retour sur le site, vérification
 * à l'affichage d'une page, purge quotidienne). Avant, chaque voie avait sa
 * propre copie de cette logique.
 */
export async function settlePayment(
  payment: { id: string; documentId: string | null; status: string },
  outcome: CheckPaymentStatusResult,
): Promise<void> {
  if (payment.status !== "PENDING") return;

  if (outcome.status === "success") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS" } }),
      ...(payment.documentId ? [markDocumentPaid(payment.documentId)] : []),
    ]);
  } else if (outcome.status === "failed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
}

/** Au-delà, une transaction non validée a forcément expiré chez l'opérateur. */
const RECENT_PENDING_MS = 48 * 60 * 60 * 1000;

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
export async function refreshPendingPayments(filter: { userId?: string; documentId?: string; limit?: number }): Promise<{ processingPaymentId?: string }> {
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
  for (const payment of pending) {
    const outcome = await getGateway(payment.provider).checkStatus({ provider: payment.provider, providerRef: payment.providerRef! });
    await settlePayment(payment, outcome);
    if (outcome.status === "processing" && !processingPaymentId) processingPaymentId = payment.id;
  }
  return { processingPaymentId };
}
