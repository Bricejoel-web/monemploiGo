import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCvTemplatesByCategory, LAYOUT_LABELS } from "@/lib/cv/catalog";
import { SLUG_TO_CATEGORY } from "@/lib/cv/category-routes";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { CatalogSwipeSection } from "@/components/cv/CatalogSwipeSection";
import { AtsGuide } from "@/components/cv/AtsGuide";
import { pickPersona, pickGermanPersona, genderOfPortraitGroup, ethnicityOfPortraitGroup } from "@/lib/cv/personas";
import { pickSamplePortrait, seedFromString, unsplashSiteLink } from "@/lib/photos/unsplash";
import type { CvCategory, CvTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";

function TemplateCard({
  template,
  category,
  locale,
  dict,
  index,
  mode,
}: {
  template: CvTemplateMeta;
  category: CvCategory;
  locale: Locale;
  dict: Dictionary;
  index: number;
  mode: "grid" | "scroll";
}) {
  const portrait = pickSamplePortrait(seedFromString(template.slug));
  const gender = genderOfPortraitGroup(portrait.group);
  const ethnicity = ethnicityOfPortraitGroup(portrait.group);
  const persona =
    category === "GERMAN_ATS" ? pickGermanPersona(template.slug, gender, ethnicity) : pickPersona(locale, template.slug, gender, ethnicity);

  return (
    <Link
      href={`/${locale}/cv/modele/${template.slug}`}
      className={`animate-fade-in-up group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] ${
        mode === "scroll" ? "w-72 shrink-0 snap-start" : "w-full"
      }`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.4)}s` }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      <div className="w-full overflow-hidden rounded-md">
        <div className="transition-transform duration-300 ease-out group-hover:scale-105">
          <TemplateThumbnail>
            <CvRenderer
              data={{ ...persona, photoDataUrl: portrait.urlSmall }}
              layoutId={template.layoutId}
              theme={template.theme}
              includePhoto
              locale={locale}
            />
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

export default async function CvCategoryPage({ params }: PageProps<"/[locale]/cv/[categorie]">) {
  const { locale, categorie } = await params;
  if (!isLocale(locale)) notFound();

  const category = SLUG_TO_CATEGORY[categorie];
  if (!category) notFound();

  const dict = await getDictionary(locale as Locale);
  const templates = getCvTemplatesByCategory(category);

  const groups = new Map<string, CvTemplateMeta[]>();
  for (const template of templates) {
    const key = template.layoutId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(template);
  }

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-12 dark:bg-white/[0.05]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="animate-fade-in-up px-6">
          <Link
            href={`/${locale}/cv`}
            className="inline-flex items-center gap-1 text-sm font-medium text-black/60 transition-colors hover:text-[#c94f30] dark:text-white/60 dark:hover:text-[#f2994a]"
          >
            ← {dict.catalog.backToCategories}
          </Link>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            {dict.dashboard[category === "GERMAN_ATS" ? "germanAts" : (category.toLowerCase() as "standard" | "premium" | "ats")]}
          </h1>
          <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 max-w-2xl text-black/60 dark:text-white/60">{dict.catalog.categoryDescriptions[category]}</p>
        </div>

        {(category === "ATS" || category === "GERMAN_ATS") && (
          <div className="animate-fade-in-up px-6" style={{ animationDelay: "0.08s" }}>
            <AtsGuide variant={category === "ATS" ? "ats" : "german"} dict={dict} locale={locale as Locale} />
          </div>
        )}

        <div className="hidden px-6 sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {templates.map((template, index) => (
            <TemplateCard key={template.slug} template={template} category={category} locale={locale as Locale} dict={dict} index={index} mode="grid" />
          ))}
        </div>

        <div className="flex flex-col gap-8 sm:hidden">
          {[...groups.entries()].map(([layoutId, items]) => (
            <CatalogSwipeSection key={layoutId} title={LAYOUT_LABELS[layoutId as keyof typeof LAYOUT_LABELS] ?? layoutId}>
              {items.map((template, index) => (
                <TemplateCard key={template.slug} template={template} category={category} locale={locale as Locale} dict={dict} index={index} mode="scroll" />
              ))}
            </CatalogSwipeSection>
          ))}
        </div>

        <p className="px-6 text-center text-xs text-black/40 dark:text-white/40">
          Photos de démonstration via{" "}
          <a href={unsplashSiteLink()} target="_blank" rel="noopener noreferrer" className="underline">
            Unsplash
          </a>
        </p>
      </div>
    </div>
  );
}
