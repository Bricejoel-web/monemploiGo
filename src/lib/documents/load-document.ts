import "server-only";
import type { Document } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { getCvTemplateBySlug, getCoverLetterBySlug, getBewerbungsbriefBySlug } from "@/lib/cv/catalog";
import type { CvData, CoverLetterData, BewerbungsbriefData } from "@/lib/cv/types";
import { getProAccess } from "@/lib/pro/subscription";
import { retentionCutoff } from "./retention";

/** Modèle + contenu d'un document enregistré, prêts à être affichés. */
export function parseDocument(document: Document) {
  if (document.type === "CV") {
    const template = getCvTemplateBySlug(document.templateSlug);
    if (!template) return null;
    const data = JSON.parse(document.contentJson) as CvData;
    if (document.includePhoto && document.photoDataUrl) data.photoDataUrl = document.photoDataUrl;
    return { document, kind: "CV" as const, template, data };
  }

  if (document.type === "BEWERBUNGSBRIEF") {
    const template = getBewerbungsbriefBySlug(document.templateSlug);
    if (!template) return null;
    const data = JSON.parse(document.contentJson) as BewerbungsbriefData;
    return { document, kind: "BEWERBUNGSBRIEF" as const, template, data };
  }

  const template = getCoverLetterBySlug(document.templateSlug);
  if (!template) return null;
  const data = JSON.parse(document.contentJson) as CoverLetterData;
  return { document, kind: "COVER_LETTER" as const, template, data };
}

// La date limite est appliquée ici, à la lecture, et pas seulement par la
// purge quotidienne : un document expiré n'est plus servi même si la purge
// n'est pas encore passée.
export async function loadOwnedPaidDocument(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId, professionalAccountId: null, status: "PAID", paidAt: { gte: retentionCutoff() } },
  });
  return document ? parseDocument(document) : null;
}

/**
 * Document téléchargeable par cet utilisateur : document particulier payé
 * et encore disponible (règle ci-dessus, inchangée), ou document Pro
 * FINALISÉ de son espace Pro, tant que l'abonnement est actif ou en lecture
 * seule (90 jours après expiration, CGU Pro art. 11).
 */
export async function loadDownloadableDocument(documentId: string, userId: string) {
  const personal = await loadOwnedPaidDocument(documentId, userId);
  if (personal) return { ...personal, pro: false as const };

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId, professionalAccountId: { not: null }, status: "FINALIZED" },
  });
  if (!document?.professionalAccountId) return null;
  const access = await getProAccess(document.professionalAccountId);
  if (access.state !== "active" && access.state !== "readonly") return null;
  const parsed = parseDocument(document);
  return parsed ? { ...parsed, pro: true as const } : null;
}
