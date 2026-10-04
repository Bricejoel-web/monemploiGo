import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getCvTemplateBySlug } from "@/lib/cv/catalog";
import { CvEditor } from "@/components/cv/CvEditor";
import type { CvData } from "@/lib/cv/types";
import { CvFonts } from "@/components/cv/CvFonts";

export default async function CvEditorPage({ params, searchParams }: PageProps<"/[locale]/cv/modele/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);

  const template = getCvTemplateBySlug(slug);
  if (!template) notFound();

  const dict = await getDictionary(locale as Locale);

  // Reprise d'un brouillon depuis le tableau de bord (?documentId=...) : on
  // précharge son contenu déjà saisi au lieu de repartir d'un formulaire vide.
  const { documentId: rawDocumentId } = await searchParams;
  const documentId = typeof rawDocumentId === "string" ? rawDocumentId : undefined;

  let initialData: CvData | undefined;
  let initialIncludePhoto = false;
  let resolvedDocumentId: string | undefined;

  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, professionalAccountId: null, type: "CV" },
    });
    if (existing) {
      initialData = JSON.parse(existing.contentJson) as CvData;
      if (existing.includePhoto && existing.photoDataUrl) initialData.photoDataUrl = existing.photoDataUrl;
      initialIncludePhoto = existing.includePhoto;
      resolvedDocumentId = existing.id;
    }
  }

  return (
    <>
      <CvFonts />
      <CvEditor
        template={template}
        dict={dict}
        locale={locale as Locale}
        documentId={resolvedDocumentId}
        initialData={initialData}
        initialIncludePhoto={initialIncludePhoto}
      />
    </>
  );
}
