import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { bewerbungsbriefCatalog, BB_LAYOUT_LABELS } from "@/lib/cv/catalog";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSection, CATALOG_CARD_CLASSES } from "@/components/cv/CatalogSection";
import { FlagIcon } from "@/components/home/icons";
import { CATEGORY_SLUGS } from "@/lib/cv/category-routes";
import { getSampleBewerbungsbriefData } from "@/lib/cv/sample-data";
import type { BewerbungsbriefTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { seoMetadata } from "@/lib/seo-pages";
import { BEWERBUNGSBRIEF_PRICE_FCFA } from "@/lib/cv/catalog";
import { CvFonts } from "@/components/cv/CvFonts";

function TemplateCard({
  template,
  locale,
  dict,
  sample,
  index,
}: {
  template: BewerbungsbriefTemplateMeta;
  locale: Locale;
  dict: Dictionary;
  sample: ReturnType<typeof getSampleBewerbungsbriefData>;
  index: number;
}) {
  return (
    <Link
      href={`/${locale}/bewerbungsbrief/modele/${template.slug}`}
      className={`animate-fade-in-up group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${CATALOG_CARD_CLASSES}`}
      style={{ animationDelay: `${Math.min(index * 0.02, 0.4)}s` }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="w-full overflow-hidden rounded-md">
        <div className="transition-transform duration-300 ease-out group-hover:scale-105">
          <TemplateThumbnail>
            <BewerbungsbriefRenderer data={sample} layoutId={template.layoutId} theme={template.theme} locale={locale} />
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

export async function generateMetadata({ params }: PageProps<"/[locale]/bewerbungsbrief">) {
  const { locale } = await params;
  return seoMetadata(locale, "bewerbungsbrief", "/bewerbungsbrief", { vars: { count: bewerbungsbriefCatalog.length, price: BEWERBUNGSBRIEF_PRICE_FCFA } });
}

export default async function BewerbungsbriefCatalogPage({ params }: PageProps<"/[locale]/bewerbungsbrief">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const sample = getSampleBewerbungsbriefData();

  const groups = new Map<string, typeof bewerbungsbriefCatalog>();
  for (const template of bewerbungsbriefCatalog) {
    const key = template.layoutId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(template);
  }

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-14 dark:bg-white/[0.05]">
      <CvFonts />
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="animate-fade-in-up px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{dict.catalog.bewerbungsbriefTitle}</h1>
          <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 text-black/60 dark:text-white/60">{dict.catalog.bewerbungsbriefSubtitle}</p>
        </div>

        <div className="animate-fade-in-up px-6" style={{ animationDelay: "0.08s" }}>
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:items-center sm:p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
              <FlagIcon className="h-5 w-5" />
            </span>
            <p className="flex-1 text-black/70 dark:text-white/70">{dict.atsGuide.bewerbungsbriefTip}</p>
            <Link
              href={`/${locale}/cv/${CATEGORY_SLUGS.GERMAN_ATS}`}
              className="shrink-0 rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black/80 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
            >
              {dict.atsGuide.bewerbungsbriefTipCta} →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          {[...groups.entries()].map(([layoutId, templates]) => (
            <CatalogSection key={layoutId} title={BB_LAYOUT_LABELS[layoutId as keyof typeof BB_LAYOUT_LABELS] ?? layoutId}>
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
