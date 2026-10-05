import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { COVER_LETTER_PRICE_FCFA } from "@/lib/cv/catalog";
import type { CvData } from "@/lib/cv/types";
import { pageMetadata } from "@/lib/seo";
import { letterModelBySlug } from "@/lib/letters/canada/models";
import { profileFromCv, type CanadaLetterContent } from "@/lib/letters/canada/profile";
import { CanadaLetterWizard, type CvChoice } from "@/components/letters/CanadaLetterWizard";
import { CvFonts } from "@/components/cv/CvFonts";

export async function generateMetadata({ params }: PageProps<"/[locale]/lettre-canada">) {
  const { locale } = await params;
  return pageMetadata({ locale: locale as Locale, path: "/lettre-canada", title: "Lettre de présentation Canada | monemploiGo", description: "Créez une lettre de présentation adaptée à un employeur canadien.", noindex: true });
}

// Lettre de présentation Canada : accessible sans CV MonEmploiGo. Les CV
// déjà créés (s'il y en a) sont proposés comme source d'informations.
export default async function CanadaLetterPage({ params, searchParams }: PageProps<"/[locale]/lettre-canada">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);
  const { documentId } = await searchParams;

  const cvDocuments = await prisma.document.findMany({
    where: { userId: session.userId, professionalAccountId: null, type: "CV" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, contentJson: true },
  });
  const cvs: CvChoice[] = cvDocuments.map((d) => ({ id: d.id, title: d.title, profile: profileFromCv(JSON.parse(d.contentJson) as CvData) }));

  // Reprise d'une lettre existante (depuis le tableau de bord).
  let initial: { documentId: string; slug: string; content: CanadaLetterContent } | undefined;
  if (typeof documentId === "string") {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, professionalAccountId: null, type: "COVER_LETTER" },
      select: { id: true, templateSlug: true, contentJson: true },
    });
    if (existing && letterModelBySlug(existing.templateSlug)) {
      initial = { documentId: existing.id, slug: existing.templateSlug, content: JSON.parse(existing.contentJson) as CanadaLetterContent };
    }
  }

  return (
    <>
      <CvFonts />
      <CanadaLetterWizard
        locale={locale as Locale}
        t={dict.canadaLetter}
        pageLabels={{ fits: dict.editor.pageCountFits, overflow: dict.editor.pageCountOverflow, hint: dict.editor.pageCountHint }}
        priceFcfa={COVER_LETTER_PRICE_FCFA}
        cvs={cvs}
        initial={initial}
      />
    </>
  );
}
