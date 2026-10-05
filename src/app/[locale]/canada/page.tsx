import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { COVER_LETTER_PRICE_FCFA, PRICE_FCFA } from "@/lib/cv/catalog";
import { CATEGORY_SLUGS } from "@/lib/cv/category-routes";
import { seoMetadata } from "@/lib/seo-pages";
import { FlagCanada } from "@/components/referral/icons";
import { CheckIcon } from "@/components/home/icons";

// Présentation du domaine Canada : uniquement des documents de candidature
// (CV Canadien, CV Canadien ATS, lettre de présentation), jamais de
// document d'immigration.
export async function generateMetadata({ params }: PageProps<"/[locale]/canada">) {
  const { locale } = await params;
  return seoMetadata(locale, "canadaPage", "/canada");
}

export default async function CanadaPage({ params }: PageProps<"/[locale]/canada">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const t = dict.canadaPage;
  const price = (n: number) => t.priceLabel.replace("{price}", new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR").format(n));
  const products = [
    { title: t.canadaTitle, text: t.canadaText, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA}`, price: PRICE_FCFA.CANADA },
    { title: t.canadaAtsTitle, text: t.canadaAtsText, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA_ATS}`, price: PRICE_FCFA.CANADA_ATS },
    { title: t.letterTitle, text: t.letterText, href: `/${locale}/lettre-canada`, price: COVER_LETTER_PRICE_FCFA },
  ];

  return (
    <div className="bg-[#efe6d8] py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
        <section className="rounded-3xl bg-[#16324f] p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-3">
            <FlagCanada className="h-6 w-12" />
            <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">{t.eyebrow}</span>
          </div>
          <h1 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-white/80">{t.description}</p>
          <Link
            href={`/${locale}/cv/${CATEGORY_SLUGS.CANADA}`}
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#eb5757]/30"
          >
            {t.cta}
          </Link>
          <Link href={`/${locale}/lettre-canada`} className="mt-6 ml-3 inline-flex rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            {t.ctaLetter}
          </Link>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold">{t.productsTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <Link key={p.href} href={p.href} className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5">
                <span className="flex items-center gap-2 font-semibold">
                  <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  {p.title}
                </span>
                <span className="text-sm text-black/70 dark:text-white/70">{p.text}</span>
                <span className="mt-auto flex items-center justify-between pt-2 text-sm">
                  <span className="font-medium">{price(p.price)}</span>
                  <span className="font-medium text-[#c94f30] dark:text-[#f2994a]">{t.seeTemplates} →</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">{t.languageNote}</p>
        </section>

        <p className="px-1 text-xs text-black/55 dark:text-white/55">{t.disclaimer}</p>
      </div>
    </div>
  );
}
