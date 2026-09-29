import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getCoverLetterBySlug } from "@/lib/cv/catalog";
import { CoverLetterEditor } from "@/components/cv/CoverLetterEditor";
import type { CoverLetterData } from "@/lib/cv/types";
import { CvFonts } from "@/components/cv/CvFonts";

export default async function CoverLetterEditorPage({ params, searchParams }: PageProps<"/[locale]/lettres-de-motivation/modele/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);

  const template = getCoverLetterBySlug(slug);
  if (!template) notFound();

  const dict = await getDictionary(locale as Locale);

  // Reprise d'un brouillon depuis le tableau de bord (?documentId=...).
  const { documentId: rawDocumentId } = await searchParams;
  const documentId = typeof rawDocumentId === "string" ? rawDocumentId : undefined;

  let initialData: CoverLetterData | undefined;
  let resolvedDocumentId: string | undefined;

  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, type: "COVER_LETTER" },
    });
    if (existing) {
      initialData = JSON.parse(existing.contentJson) as CoverLetterData;
      resolvedDocumentId = existing.id;
    }
  }

  return (
    <>
      <CvFonts />
      <CoverLetterEditor
        template={template}
        dict={dict}
        locale={locale as Locale}
        documentId={resolvedDocumentId}
        initialData={initialData}
      />
    </>
  );
}
