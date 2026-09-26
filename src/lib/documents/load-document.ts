import "server-only";
import { prisma } from "@/lib/db/client";
import { getCvTemplateBySlug, getCoverLetterBySlug, getBewerbungsbriefBySlug } from "@/lib/cv/catalog";
import type { CvData, CoverLetterData, BewerbungsbriefData } from "@/lib/cv/types";

export async function loadOwnedPaidDocument(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId, status: "PAID" },
  });
  if (!document) return null;

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
