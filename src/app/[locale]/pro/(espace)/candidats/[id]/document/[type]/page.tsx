import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { proDocumentKind } from "@/lib/pro/document-kinds";
import { BB_LAYOUT_LABELS, CL_LAYOUT_LABELS, LAYOUT_LABELS, bewerbungsbriefCatalog, coverLetterCatalog, getCvTemplatesByCategory } from "@/lib/cv/catalog";
import { getSampleBewerbungsbriefData, getSampleCoverLetterData } from "@/lib/cv/sample-data";
import { pickGermanPersona, pickPersona, genderOfPortraitGroup, ethnicityOfPortraitGroup } from "@/lib/cv/personas";
import { pickSamplePortrait, seedFromString } from "@/lib/photos/unsplash";
import { pageMetadata } from "@/lib/seo";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSection, CATALOG_CARD_CLASSES } from "@/components/cv/CatalogSection";
import { CvFonts } from "@/components/cv/CvFonts";
import type { ReactNode } from "react";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Choisir un modèle | MonEmploiGo Pro",
  description: "Choix du modèle de document.",
  noindex: true,
  frenchOnly: true,
});

function ModelCard({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${CATALOG_CARD_CLASSES}`}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="w-full overflow-hidden rounded-md">
        <TemplateThumbnail>{children}</TemplateThumbnail>
      </div>
      <span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-black/70 group-hover:bg-gradient-to-r group-hover:from-[#f2994a] group-hover:to-[#eb5757] group-hover:text-white dark:bg-white/10 dark:text-white/70">
        Utiliser ce modèle
      </span>
    </Link>
  );
}

// Mêmes modèles que le catalogue du site, avec les mêmes exemples fictifs
// d'aperçu ; le document final reprend les informations du candidat.
export default async function ChooseModelPage({ params }: PageProps<"/[locale]/pro/candidats/[id]/document/[type]">) {
  const account = await requireProAccount();
  const { id, type } = await params;
  const kind = proDocumentKind(type);
  const candidate = await getOwnedCandidate(account.id, id);
  if (!candidate || !kind) notFound();
  const base = `/fr/pro/candidats/${candidate.id}/document/${kind.slug}`;

  const groups = new Map<string, ReactNode[]>();
  const add = (title: string, node: ReactNode) => groups.set(title, [...(groups.get(title) ?? []), node]);

  if (kind.kind === "CV") {
    for (const template of getCvTemplatesByCategory(kind.category)) {
      const portrait = pickSamplePortrait(seedFromString(template.slug));
      const gender = genderOfPortraitGroup(portrait.group);
      const ethnicity = ethnicityOfPortraitGroup(portrait.group);
      const persona = kind.category === "GERMAN_ATS" ? pickGermanPersona(template.slug, gender, ethnicity) : pickPersona("fr", template.slug, gender, ethnicity);
      add(
        LAYOUT_LABELS[template.layoutId] ?? template.layoutId,
        <ModelCard key={template.slug} href={`${base}/${template.slug}`}>
          <CvRenderer data={{ ...persona, photoDataUrl: portrait.urlSmall }} layoutId={template.layoutId} theme={template.theme} includePhoto locale="fr" />
        </ModelCard>,
      );
    }
  } else if (kind.kind === "COVER_LETTER") {
    const sample = getSampleCoverLetterData("fr");
    for (const template of coverLetterCatalog) {
      add(
        CL_LAYOUT_LABELS[template.layout.key] ?? template.layout.key,
        <ModelCard key={template.slug} href={`${base}/${template.slug}`}>
          <CoverLetterRenderer data={sample} layout={template.layout} theme={template.theme} locale="fr" />
        </ModelCard>,
      );
    }
  } else {
    const sample = getSampleBewerbungsbriefData();
    for (const template of bewerbungsbriefCatalog) {
      add(
        BB_LAYOUT_LABELS[template.layoutId] ?? template.layoutId,
        <ModelCard key={template.slug} href={`${base}/${template.slug}`}>
          <BewerbungsbriefRenderer data={sample} layoutId={template.layoutId} theme={template.theme} locale="fr" />
        </ModelCard>,
      );
    }
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <CvFonts />
      <div className="px-4 sm:px-6 lg:px-10">
        <Link href={`/fr/pro/candidats/${candidate.id}/document`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Choisir un autre type
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {kind.label} pour {candidate.firstName} {candidate.lastName}
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Choisissez un modèle. Les aperçus utilisent des exemples fictifs.</p>
      </div>
      {[...groups.entries()].map(([title, cards]) => (
        <CatalogSection key={title} title={title}>
          {cards}
        </CatalogSection>
      ))}
    </div>
  );
}
