import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PRICE_FCFA, getCvTemplatesByCategory } from "@/lib/cv/catalog";
import { CATEGORY_LABEL_KEYS, CATEGORY_SLUGS } from "@/lib/cv/category-routes";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { TemplateThumbnail } from "@/components/cv/TemplateThumbnail";
import { FlatPriceBadge } from "@/components/cv/FlatPriceBadge";
import { pickPersona, pickGermanPersona, genderOfPortraitGroup, ethnicityOfPortraitGroup } from "@/lib/cv/personas";
import { pickSamplePortrait, seedFromString } from "@/lib/photos/unsplash";
import type { CvCategory } from "@/lib/cv/types";
import { seoMetadata } from "@/lib/seo-pages";
import { allCvTemplates } from "@/lib/cv/catalog";
import { CvFonts } from "@/components/cv/CvFonts";

const CATEGORIES: CvCategory[] = ["STANDARD", "PREMIUM", "ATS", "GERMAN_ATS", "CANADA", "CANADA_ATS"];

export async function generateMetadata({ params }: PageProps<"/[locale]/cv">) {
  const { locale } = await params;
  return seoMetadata(locale, "cvHub", "/cv", { vars: { count: allCvTemplates.length } });
}

export default async function CvCatalogPage({ params }: PageProps<"/[locale]/cv">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-14 dark:bg-white/[0.05]">
      <CvFonts />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <div className="animate-fade-in-up text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{dict.catalog.cvTitle}</h1>
          <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
          <p className="mt-4 text-black/60 dark:text-white/60">{dict.catalog.cvSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {CATEGORIES.map((category, index) => {
            const templates = getCvTemplatesByCategory(category);
            const first = templates[0];
            const portrait = pickSamplePortrait(seedFromString(first.slug));
            const gender = genderOfPortraitGroup(portrait.group);
            const ethnicity = ethnicityOfPortraitGroup(portrait.group);
            const persona =
              category === "GERMAN_ATS"
                ? pickGermanPersona(first.slug, gender, ethnicity)
                : pickPersona(locale as Locale, first.slug, gender, ethnicity);
            return (
              <Link
                key={category}
                href={`/${locale}/cv/${CATEGORY_SLUGS[category]}`}
                className="animate-fade-in-up group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:flex-row dark:border-white/10 dark:bg-white/[0.06]"
                style={{ animationDelay: `${0.08 * index}s` }}
              >
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />
                <div className="mx-auto shrink-0 overflow-hidden rounded-md sm:mx-0">
                  <div className="transition-transform duration-300 ease-out group-hover:scale-105">
                    <TemplateThumbnail>
                      <CvRenderer
                        data={{ ...persona, photoDataUrl: portrait.urlSmall }}
                        layoutId={first.layoutId}
                        theme={first.theme}
                        includePhoto={!category.startsWith("CANADA")}
                        locale={locale as Locale}
                      />
                    </TemplateThumbnail>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1.5">
                  <h2 className="text-lg font-semibold">{dict.dashboard[CATEGORY_LABEL_KEYS[category]]}</h2>
                  <p className="text-sm text-black/60 dark:text-white/60">{dict.catalog.categoryDescriptions[category]}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <FlatPriceBadge label={dict.catalog.allTemplatesAt} priceFcfa={PRICE_FCFA[category]} />
                    <span
                      aria-hidden="true"
                      className="text-sm font-medium text-[#c94f30] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#f2994a]"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
