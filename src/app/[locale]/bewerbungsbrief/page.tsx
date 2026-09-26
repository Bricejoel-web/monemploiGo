import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { bewerbungsbriefCatalog, BB_LAYOUT_LABELS } from "@/lib/cv/catalog";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSwipeSection } from "@/components/cv/CatalogSwipeSection";
import { getSampleBewerbungsbriefData } from "@/lib/cv/sample-data";
import type { BewerbungsbriefTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";

function TemplateCard({
  template,
  locale,
  dict,
  sample,
  index,
  mode,
}: {
  template: BewerbungsbriefTemplateMeta;
  locale: Locale;
  dict: Dictionary;
  sample: ReturnType<typeof getSampleBewerbungsbriefData>;
  index: number;
  mode: "grid" | "scroll";
}) {
  return (
    <Link
      href={`/${locale}/bewerbungsbrief/modele/${template.slug}`}
      className={`animate-fade-in-up group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${
        mode === "scroll" ? "w-64 shrink-0 snap-start" : "w-full"
      }`}
      style={{ animationDelay: `${Math.min(index * 0.02, 0.4)}s` }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="overflow-hidden rounded-md">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="animate-fade-in-up px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{dict.catalog.bewerbungsbriefTitle}</h1>
          <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 text-black/60 dark:text-white/60">{dict.catalog.bewerbungsbriefSubtitle}</p>
        </div>

        <div className="hidden px-6 sm:grid sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {bewerbungsbriefCatalog.map((template, index) => (
            <TemplateCard key={template.slug} template={template} locale={locale as Locale} dict={dict} sample={sample} index={index} mode="grid" />
          ))}
        </div>

        <div className="flex flex-col gap-8 sm:hidden">
          {[...groups.entries()].map(([layoutId, templates]) => (
            <CatalogSwipeSection key={layoutId} title={BB_LAYOUT_LABELS[layoutId as keyof typeof BB_LAYOUT_LABELS] ?? layoutId}>
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
