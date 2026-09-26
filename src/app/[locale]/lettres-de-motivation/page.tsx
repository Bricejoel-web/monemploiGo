import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { coverLetterCatalog, CL_LAYOUT_LABELS } from "@/lib/cv/catalog";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSwipeSection } from "@/components/cv/CatalogSwipeSection";
import { getSampleCoverLetterData } from "@/lib/cv/sample-data";
import type { CoverLetterTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";

function TemplateCard({
  template,
  locale,
  dict,
  sample,
  index,
  mode,
}: {
  template: CoverLetterTemplateMeta;
  locale: Locale;
  dict: Dictionary;
  sample: ReturnType<typeof getSampleCoverLetterData>;
  index: number;
  mode: "grid" | "scroll";
}) {
  return (
    <Link
      href={`/${locale}/lettres-de-motivation/modele/${template.slug}`}
      className={`animate-fade-in-up group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${
        mode === "scroll" ? "w-64 shrink-0 snap-start" : "w-full"
      }`}
      style={{ animationDelay: `${Math.min(index * 0.02, 0.4)}s` }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="overflow-hidden rounded-md">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="animate-fade-in-up px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{dict.catalog.letterTitle}</h1>
          <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 text-black/60 dark:text-white/60">{dict.catalog.letterSubtitle}</p>
        </div>

        {/* Bureau/tablette : grille classique. */}
        <div className="hidden px-6 sm:grid sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {coverLetterCatalog.map((template, index) => (
            <TemplateCard key={template.slug} template={template} locale={locale as Locale} dict={dict} sample={sample} index={index} mode="grid" />
          ))}
        </div>

        {/* Mobile : une section par mise en page, chacune défilant
            horizontalement au doigt (façon Play Store) — évite un défilement
            vertical interminable sur un catalogue de 100 modèles. */}
        <div className="flex flex-col gap-8 sm:hidden">
          {[...groups.entries()].map(([layoutKey, templates]) => (
            <CatalogSwipeSection key={layoutKey} title={CL_LAYOUT_LABELS[layoutKey] ?? layoutKey}>
              {templates.map((template, index) => (
                <TemplateCard key={template.slug} template={template} locale={locale as Locale} dict={dict} sample={sample} index={index} mode="scroll" />
              ))}
            </CatalogSwipeSection>
          ))}
        </div>
      </div>
    </div>
  );
}
