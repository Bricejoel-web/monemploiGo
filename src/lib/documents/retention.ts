import "server-only";
import { prisma } from "@/lib/db/client";

// Durée de conservation des documents, décidée avec l'utilisateur
// (2026-09-27) pour ne pas surcharger la base de données :
// - document payé : retéléchargeable gratuitement pendant 3 semaines à
//   partir du paiement, puis supprimé ;
// - brouillon : supprimé après 3 semaines sans modification.
// Les paiements eux-mêmes ne sont jamais supprimés (voir schema.prisma).
export const RETENTION_DAYS = 21;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function expiresAt(from: Date): Date {
  return new Date(from.getTime() + RETENTION_MS);
}

/** Documents payés/modifiés avant cette date sont expirés. */
export function retentionCutoff(now = new Date()): Date {
  return new Date(now.getTime() - RETENTION_MS);
}

/** Seul point d'entrée pour marquer un document comme payé : enregistre
 * toujours la date de paiement, qui fait démarrer la période de
 * conservation. */
export function markDocumentPaid(documentId: string) {
  return prisma.document.update({ where: { id: documentId }, data: { status: "PAID", paidAt: new Date() } });
}

/** Supprime les documents arrivés au bout de leur période de conservation.
 * Un brouillon lié à un paiement encore en attente n'est jamais supprimé :
 * le client a peut-être payé sans être revenu sur le site (le webhook Notch
 * Pay étant défaillant côté plateforme, voir docs/ROADMAP.md). */
export async function purgeExpiredDocuments(now = new Date()) {
  const cutoff = retentionCutoff(now);

  const paid = await prisma.document.deleteMany({
    where: { status: "PAID", paidAt: { lt: cutoff } },
  });

  const drafts = await prisma.document.deleteMany({
    where: {
      status: "DRAFT",
      updatedAt: { lt: cutoff },
      payments: { none: { status: { in: ["PENDING", "SUCCESS"] } } },
    },
  });

  return { paidDeleted: paid.count, draftsDeleted: drafts.count };
}
