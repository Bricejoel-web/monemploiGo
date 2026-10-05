import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { BEWERBUNGSBRIEF_PRICE_FCFA, COVER_LETTER_PRICE_FCFA, PRICE_FCFA } from "@/lib/cv/catalog";
import { CATEGORY_SLUGS } from "@/lib/cv/category-routes";
import { seoMetadata } from "@/lib/seo-pages";
import { FlagCanada, FlagGermany } from "@/components/referral/icons";
import { CheckIcon } from "@/components/home/icons";

// « Candidater à l'étranger » : point d'entrée unique vers les documents par
// pays (Allemagne, Canada). Organisation validée par l'utilisateur : les
// catalogues restent rangés par type, cette page regroupe par destination.
export async function generateMetadata({ params }: PageProps<"/[locale]/etranger">) {
  const { locale } = await params;
  return seoMetadata(locale, "abroadPage", "/etranger");
}

export default async function AbroadPage({ params }: PageProps<"/[locale]/etranger">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const t = dict.abroadPage;
  const price = (n: number) =>
    dict.canadaPage.priceLabel.replace("{price}", new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR").format(n));

  const countries: { key: string; flag: ReactNode; title: string; text: string; more?: { href: string; label: string }; items: { title: string; href: string; price: number }[] }[] = [
    {
      key: "germany",
      flag: <FlagGermany className="h-7 w-11" />,
      title: t.germanyTitle,
      text: t.germanyText,
      items: [
        { title: t.germanyCv, href: `/${locale}/cv/${CATEGORY_SLUGS.GERMAN_ATS}`, price: PRICE_FCFA.GERMAN_ATS },
        { title: t.germanyLetter, href: `/${locale}/bewerbungsbrief`, price: BEWERBUNGSBRIEF_PRICE_FCFA },
      ],
    },
    {
      key: "canada",
      flag: <FlagCanada className="h-7 w-14" />,
      title: t.canadaTitle,
      text: t.canadaText,
      more: { href: `/${locale}/canada`, label: t.canadaMore },
      items: [
        { title: t.canadaCv, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA}`, price: PRICE_FCFA.CANADA },
        { title: t.canadaCvAts, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA_ATS}`, price: PRICE_FCFA.CANADA_ATS },
        { title: t.canadaLetter, href: `/${locale}/lettre-canada`, price: COVER_LETTER_PRICE_FCFA },
      ],
    },
  ];

  return (
    <div className="bg-[#efe6d8] py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
        <section className="rounded-3xl bg-[#16324f] p-6 text-white shadow-lg sm:p-8">
          <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">{t.eyebrow}</span>
          <h1 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-white/80">{t.description}</p>
        </section>

        {countries.map((c) => (
          <section key={c.key} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              {c.flag}
              <h2 className="text-lg font-semibold">{c.title}</h2>
            </div>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">{c.text}</p>
            <div className="mt-4 flex flex-col gap-3">
              {c.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-4 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                    {item.title}
                  </span>
                  <span className="shrink-0 text-sm font-medium">{price(item.price)} →</span>
                </Link>
              ))}
            </div>
            {c.more && (
              <Link href={c.more.href} className="mt-4 inline-flex text-sm font-medium text-[#c94f30] hover:underline dark:text-[#f2994a]">
                {c.more.label} →
              </Link>
            )}
          </section>
        ))}

        <p className="px-1 text-xs text-black/55 dark:text-white/55">{t.disclaimer}</p>
      </div>
    </div>
  );
}
