import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { coverLetterCatalog, CL_LAYOUT_LABELS } from "@/lib/cv/catalog";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSection, CATALOG_CARD_CLASSES } from "@/components/cv/CatalogSection";
import { FlagCanada, FlagGermany } from "@/components/referral/icons";
import { getSampleCoverLetterData } from "@/lib/cv/sample-data";
import type { CoverLetterTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { seoMetadata } from "@/lib/seo-pages";
import { COVER_LETTER_PRICE_FCFA } from "@/lib/cv/catalog";
import { CvFonts } from "@/components/cv/CvFonts";

function TemplateCard({
  template,
  locale,
  dict,
  sample,
  index,
}: {
  template: CoverLetterTemplateMeta;
  locale: Locale;
  dict: Dictionary;
  sample: ReturnType<typeof getSampleCoverLetterData>;
  index: number;
}) {
  return (
    <Link
      href={`/${locale}/lettres-de-motivation/modele/${template.slug}`}
      className={`animate-fade-in-up group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${CATALOG_CARD_CLASSES}`}
      style={{ animationDelay: `${Math.min(index * 0.02, 0.4)}s` }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="w-full overflow-hidden rounded-md">
        <div className="transition-transform duration-300 ease-out group-hover:scale-105">
          <TemplateThumbnail>
            <CoverLetterRenderer data={sample} layout={template.layout} theme={template.theme} locale={locale} />
          </TemplateThumbnail>
        </div>
      </div>
      <p className="text-sm font-semibold">{template.priceFcfa} FCFA</p>
      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-black/70 transition-colors group-hover:bg-gradient-to-r group-hover:from-[#f2994a] group-hover:to-[#eb5757] group-hover:text-white dark:bg-white/10 dark:text-white/70">
        {dict.catalog.customize}
      </span>
    </Link>
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/lettres-de-motivation">) {
  const { locale } = await params;
  return seoMetadata(locale, "coverLetters", "/lettres-de-motivation", { vars: { count: coverLetterCatalog.length, price: COVER_LETTER_PRICE_FCFA } });
}

export default async function CoverLetterCatalogPage({ params }: PageProps<"/[locale]/lettres-de-motivation">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const sample = getSampleCoverLetterData(locale as Locale);

  // Les modèles sont déjà regroupés par mise en page dans l'ordre du
  // catalogue (`coverLetterLayouts.flatMap(...)`) : ce regroupement se
  // contente donc de les répartir dans des groupes contigus, sans les
  // réordonner.
  const groups = new Map<string, typeof coverLetterCatalog>();
  for (const template of coverLetterCatalog) {
    const key = template.layout.key;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(template);
  }

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-14 dark:bg-white/[0.05]">
      <CvFonts />
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="animate-fade-in-up px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{dict.catalog.letterTitle}</h1>
          <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 text-black/60 dark:text-white/60">{dict.catalog.letterSubtitle}</p>
        </div>
        {/* Organisation validée par l'utilisateur : par type de document, avec
            une section « par pays » (Allemagne, Canada), puis les lettres générales. */}
        <section className="flex flex-col gap-4 px-6">
          <h2 className="text-xl font-semibold">{dict.catalog.letterGroups.byCountry}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { href: `/${locale}/bewerbungsbrief`, flag: <FlagGermany className="h-7 w-11" />, title: dict.catalog.letterGroups.bewerbungsbrief, hint: dict.catalog.letterGroups.bewerbungsbriefHint },
              { href: `/${locale}/lettre-canada`, flag: <FlagCanada className="h-7 w-14" />, title: dict.canadaLetter.entry, hint: dict.canadaLetter.entryHint },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06]"
              >
                {item.flag}
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-sm text-black/60 dark:text-white/60">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <h2 className="-mb-4 px-6 text-xl font-semibold">{dict.catalog.letterGroups.general}</h2>
        <div className="flex flex-col gap-10">
          {[...groups.entries()].map(([layoutKey, templates]) => (
            <CatalogSection key={layoutKey} title={CL_LAYOUT_LABELS[layoutKey] ?? layoutKey}>
              {templates.map((template, index) => (
                <TemplateCard key={template.slug} template={template} locale={locale as Locale} dict={dict} sample={sample} index={index} />
              ))}
            </CatalogSection>
          ))}
        </div>
      </div>
    </div>
  );
}
