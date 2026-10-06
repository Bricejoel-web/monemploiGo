"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { rateLimit } from "@/lib/security/rate-limit";
import { letterModelBySlug } from "./models";
import { profileFromImportedText, type CanadaLetterContent, type ImportResult } from "./profile";

// Lettre de présentation Canada : import d'un CV PDF et enregistrement.
// Le fichier importé n'est jamais stocké ni rendu public : il est lu en
// mémoire, son texte est analysé, puis il est oublié. Seules les
// informations confirmées par le candidat sont enregistrées avec la lettre.

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

export async function importCvPdfAction(formData: FormData): Promise<ImportResult | { error: "auth" | "limit" | "format" | "size" | "unreadable" }> {
  const session = await verifySession();
  if (!session) return { error: "auth" };
  if (!(await rateLimit(`cv-import:${session.userId}`, 10, 15 * 60 * 1000)).allowed) return { error: "limit" };

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "format" };
  if (file.size > MAX_IMPORT_BYTES) return { error: "size" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Signature « %PDF » plutôt que le seul type annoncé par le navigateur.
  if (file.type !== "application/pdf" || String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return { error: "format" };

  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const { text } = await extractText(await getDocumentProxy(bytes), { mergePages: true });
    // PDF scanné (image) : aucun texte à extraire.
    if (text.replace(/\s/g, "").length < 40) return { error: "unreadable" };
    return profileFromImportedText(text);
  } catch {
    return { error: "unreadable" };
  }
}

const clip = (value: string | undefined, max: number) => (value ?? "").slice(0, max);

export async function saveCanadaLetterAction(locale: string, slug: string, content: CanadaLetterContent, documentId?: string) {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  const model = letterModelBySlug(slug);
  if (!model) throw new Error("Modèle introuvable.");
  const name = [content.profile.personalInfo.firstName, content.profile.personalInfo.lastName].map((v) => v.trim()).filter(Boolean).join(" ");
  if (!name || !content.job.position.trim()) throw new Error("Informations obligatoires manquantes.");

  // Bornes de taille : une offre d'emploi collée peut être longue.
  const cleaned: CanadaLetterContent = {
    ...content,
    job: { ...content.job, offerText: clip(content.job.offerText, 8000), whyCompany: clip(content.job.whyCompany, 1500) },
    customParagraphs: content.customParagraphs?.map((p) => clip(p, 2500)).filter((p) => p.trim()),
  };
  if (!cleaned.customParagraphs?.length) delete cleaned.customParagraphs;

  const fields = { templateSlug: slug, title: `${name} — Lettre Canada ${model.name}`, contentJson: JSON.stringify(cleaned) };

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

  const document = await prisma.document.create({ data: { userId: session.userId, type: "COVER_LETTER", ...fields }, select: { id: true } });
  redirect(`/${locale}/paiement/${document.id}`);
}
