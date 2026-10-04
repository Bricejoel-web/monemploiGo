"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getBewerbungsbriefBySlug, getCoverLetterBySlug, getCvTemplateBySlug } from "@/lib/cv/catalog";
import { cleanCvData } from "@/lib/cv/clean-data";
import type { BewerbungsbriefData, CoverLetterData, CvData } from "@/lib/cv/types";
import type { CvCategory, DocumentType } from "@prisma/client";
import { requireProAccount } from "./dal";
import { computeAccess } from "./subscription";
import { LOCKED_TRANSACTION, PRO_STARTER } from "./plans";

// Documents de l'espace Pro, créés avec les éditeurs du site (mêmes
// générateurs, mêmes modèles). Tout est décidé ici : compte Pro déduit de la
// session, candidat vérifié comme appartenant à ce compte, abonnement actif,
// document verrouillé une fois finalisé, quota décompté sous verrou.

class ProDocumentError extends Error {}

/** Brouillon : créé ou mis à jour, jamais un document déjà finalisé. */
async function saveDraft(
  candidateId: string,
  type: DocumentType,
  fields: { templateSlug: string; category?: CvCategory | null; title: string; contentJson: string; includePhoto: boolean; photoDataUrl: string | null },
  documentId?: string,
) {
  const account = await requireProAccount();
  const periods = await prisma.subscription.findMany({ where: { professionalAccountId: account.id } });
  if (computeAccess(periods).state !== "active") throw new ProDocumentError("Abonnement non actif.");

  // Le candidat doit appartenir à ce compte et être actif (un candidat
  // archivé ne reçoit plus de nouveaux documents : sinon archiver servirait
  // à contourner la limite de 10 candidats actifs).
  const candidate = await prisma.professionalCandidate.findFirst({
    where: { id: candidateId, professionalAccountId: account.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!candidate) throw new ProDocumentError("Candidat introuvable ou archivé.");

  if (documentId) {
    // Seul un BROUILLON de ce compte, de ce candidat et de ce type est modifiable.
    const { count } = await prisma.document.updateMany({
      where: { id: documentId, professionalAccountId: account.id, candidateId, type, status: "DRAFT" },
      data: fields,
    });
    if (count === 0) throw new ProDocumentError("Ce document n'est plus modifiable.");
    redirect(`/fr/pro/documents/${documentId}`);
  }

  const created = await prisma.document.create({
    data: { ...fields, type, userId: account.userId, professionalAccountId: account.id, candidateId, status: "DRAFT" },
    select: { id: true },
  });
  redirect(`/fr/pro/documents/${created.id}`);
}

export async function saveProCvDocument(candidateId: string, templateSlug: string, data: CvData, includePhoto: boolean, documentId?: string) {
  const template = getCvTemplateBySlug(templateSlug);
  if (!template) throw new ProDocumentError("Modèle introuvable.");
  const cleaned = cleanCvData(data);
  await saveDraft(
    candidateId,
    "CV",
    {
      templateSlug: template.slug,
      category: template.category,
      title: `${cleaned.fullName || "CV"} — ${template.name}`,
      contentJson: JSON.stringify(cleaned),
      includePhoto,
      photoDataUrl: includePhoto ? (cleaned.photoDataUrl ?? null) : null,
    },
    documentId,
  );
}

export async function saveProCoverLetterDocument(candidateId: string, templateSlug: string, data: CoverLetterData, documentId?: string) {
  const template = getCoverLetterBySlug(templateSlug);
  if (!template) throw new ProDocumentError("Modèle introuvable.");
  await saveDraft(
    candidateId,
    "COVER_LETTER",
    { templateSlug: template.slug, title: `${data.fullName || "Lettre"} — ${template.name}`, contentJson: JSON.stringify(data), includePhoto: false, photoDataUrl: null },
    documentId,
  );
}

export async function saveProBewerbungsbriefDocument(candidateId: string, templateSlug: string, data: BewerbungsbriefData, documentId?: string) {
  const template = getBewerbungsbriefBySlug(templateSlug);
  if (!template) throw new ProDocumentError("Modèle introuvable.");
  await saveDraft(
    candidateId,
    "BEWERBUNGSBRIEF",
    { templateSlug: template.slug, title: `${data.fullName || "Bewerbungsbrief"} — ${template.name}`, contentJson: JSON.stringify(data), includePhoto: false, photoDataUrl: null },
    documentId,
  );
}

/**
 * Finalisation : le document devient téléchargeable et verrouillé, et une
 * unité du quota de la période en cours est consommée. Le tout dans UNE
 * transaction, sous verrou du compte Pro : deux finalisations simultanées
 * ne peuvent ni dépasser 30, ni compter deux fois le même document.
 */
export async function finalizeProDocument(documentId: string) {
  const account = await requireProAccount();

  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "ProfessionalAccount" WHERE "id" = ${account.id} FOR UPDATE`;
    const periods = await tx.subscription.findMany({ where: { professionalAccountId: account.id } });
    const access = computeAccess(periods);
    if (access.state !== "active") return "inactif";

    const document = await tx.document.findFirst({
      where: { id: documentId, professionalAccountId: account.id, status: "DRAFT", candidate: { status: "ACTIVE" } },
      select: { id: true },
    });
    if (!document) return "indisponible";

    const consumed = await tx.subscription.updateMany({
      where: { id: access.period.id, documentsUsed: { lt: PRO_STARTER.maxDocumentsPerPeriod } },
      data: { documentsUsed: { increment: 1 } },
    });
    if (consumed.count === 0) return "quota";

    await tx.document.update({ where: { id: document.id }, data: { status: "FINALIZED", finalizedAt: new Date() } });
    return "finalise";
  }, LOCKED_TRANSACTION);

  redirect(`/fr/pro/documents/${documentId}?${outcome === "finalise" ? "finalise=1" : `erreur=${outcome}`}`);
}
