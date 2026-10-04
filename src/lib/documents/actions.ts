"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getCvTemplateBySlug, getCoverLetterBySlug, getBewerbungsbriefBySlug } from "@/lib/cv/catalog";
import type { CvData, CoverLetterData, BewerbungsbriefData } from "@/lib/cv/types";
import { cleanCvData } from "@/lib/cv/clean-data";
// Le texte du client est enregistré EXACTEMENT tel qu'il l'a écrit. La
// correction orthographique automatique qui était appliquée ici a été
// retirée (2026-09-29) : elle remplaçait tout mot absent du dictionnaire,
// y compris les logiciels, marques et lieux (« Excel » → « Excellé »,
// « MTN » → « MAN », « Buea » → « Beta ») et, en allemand, des mots justes
// (« Zusammenarbeit » → « Zusammenarbeite »). Les fautes sont désormais
// signalées dans l'éditeur, sous forme de suggestions que le client
// accepte ou non (voir GrammarHints).

export async function saveCvDocument(
  locale: string,
  templateSlug: string,
  data: CvData,
  includePhoto: boolean,
  documentId?: string,
) {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  const template = getCvTemplateBySlug(templateSlug);
  if (!template) throw new Error("Modèle introuvable.");

  const correctedData: CvData = cleanCvData(data);

  const fields = {
    templateSlug: template.slug,
    category: template.category,
    title: `${correctedData.fullName || "CV"} — ${template.name}`,
    contentJson: JSON.stringify(correctedData),
    includePhoto,
    photoDataUrl: includePhoto ? correctedData.photoDataUrl ?? null : null,
  };

  // Reprise d'un brouillon existant : on met à jour le document déjà créé
  // plutôt que d'en créer un nouveau, pour ne pas dupliquer les créations
  // de l'utilisateur ni perdre le lien vers son paiement en cours.
  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, professionalAccountId: null, type: "CV" },
      select: { id: true },
    });
    if (existing) {
      await prisma.document.update({ where: { id: existing.id }, data: fields });
      redirect(`/${locale}/paiement/${existing.id}`);
    }
  }

  const document = await prisma.document.create({
    data: { userId: session.userId, type: "CV", ...fields },
    select: { id: true },
  });

  redirect(`/${locale}/paiement/${document.id}`);
}

export async function saveCoverLetterDocument(
  locale: string,
  templateSlug: string,
  data: CoverLetterData,
  documentId?: string,
) {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  const template = getCoverLetterBySlug(templateSlug);
  if (!template) throw new Error("Modèle introuvable.");

  const correctedData: CoverLetterData = data;

  const fields = {
    templateSlug: template.slug,
    title: `${correctedData.fullName || "Lettre"} — ${template.name}`,
    contentJson: JSON.stringify(correctedData),
  };

  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, professionalAccountId: null, type: "COVER_LETTER" },
      select: { id: true },
    });
    if (existing) {
      await prisma.document.update({ where: { id: existing.id }, data: fields });
      redirect(`/${locale}/paiement/${existing.id}`);
    }
  }

  const document = await prisma.document.create({
    data: { userId: session.userId, type: "COVER_LETTER", includePhoto: false, ...fields },
    select: { id: true },
  });

  redirect(`/${locale}/paiement/${document.id}`);
}

export async function saveBewerbungsbriefDocument(
  locale: string,
  templateSlug: string,
  data: BewerbungsbriefData,
  documentId?: string,
) {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  const template = getBewerbungsbriefBySlug(templateSlug);
  if (!template) throw new Error("Modèle introuvable.");

  // Toujours en allemand, quelle que soit la langue du site (voir décision
  // "CV Allemagne" dans docs/ROADMAP.md — même principe pour le Bewerbungsbrief).
  const correctedData: BewerbungsbriefData = data;

  const fields = {
    templateSlug: template.slug,
    title: `${correctedData.fullName || "Bewerbungsbrief"} — ${template.name}`,
    contentJson: JSON.stringify(correctedData),
  };

  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, professionalAccountId: null, type: "BEWERBUNGSBRIEF" },
      select: { id: true },
    });
    if (existing) {
      await prisma.document.update({ where: { id: existing.id }, data: fields });
      redirect(`/${locale}/paiement/${existing.id}`);
    }
  }

  const document = await prisma.document.create({
    data: { userId: session.userId, type: "BEWERBUNGSBRIEF", includePhoto: false, ...fields },
    select: { id: true },
  });

  redirect(`/${locale}/paiement/${document.id}`);
}
