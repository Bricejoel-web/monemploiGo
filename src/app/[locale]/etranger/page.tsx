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

  const countries: { key: string; flag: ReactNode; title: string; text: string; more?: { href: string; label: string }; items: { title: string; href: string; price: number; action: string }[] }[] = [
    {
      key: "germany",
      flag: <FlagGermany className="h-7 w-11" />,
      title: t.germanyTitle,
      text: t.germanyText,
      items: [
        { title: t.germanyCv, href: `/${locale}/cv/${CATEGORY_SLUGS.GERMAN_ATS}`, price: PRICE_FCFA.GERMAN_ATS, action: t.seeTemplates },
        { title: t.germanyLetter, href: `/${locale}/bewerbungsbrief`, price: BEWERBUNGSBRIEF_PRICE_FCFA, action: t.seeTemplates },
      ],
    },
    {
      key: "canada",
      flag: <FlagCanada className="h-7 w-14" />,
      title: t.canadaTitle,
      text: t.canadaText,
      more: { href: `/${locale}/canada`, label: t.canadaMore },
      items: [
        { title: t.canadaCv, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA}`, price: PRICE_FCFA.CANADA, action: t.seeTemplates },
        { title: t.canadaCvAts, href: `/${locale}/cv/${CATEGORY_SLUGS.CANADA_ATS}`, price: PRICE_FCFA.CANADA_ATS, action: t.seeTemplates },
        { title: t.canadaLetter, href: `/${locale}/lettre-canada`, price: COVER_LETTER_PRICE_FCFA, action: t.writeLetter },
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
                // Toute la carte est cliquable ; le bouton orange le rend évident
                // au premier coup d'œil (demande de l'utilisateur).
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border-2 border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f2994a] hover:shadow-md dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-[#f2994a]"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 font-semibold">
                      <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                      {item.title}
                    </span>
                    <span className="pl-6 text-sm text-black/60 dark:text-white/60">{price(item.price)}</span>
                  </span>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition group-hover:shadow-md">
                    {item.action}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </Link>
              ))}
            </div>
            {c.more && (
              <Link
                href={c.more.href}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-[#16324f] px-4 py-2 text-sm font-semibold text-[#16324f] transition hover:bg-[#16324f] hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#16324f]"
              >
                {c.more.label} <span aria-hidden="true">→</span>
              </Link>
            )}
          </section>
        ))}

        <p className="px-1 text-xs text-black/55 dark:text-white/55">{t.disclaimer}</p>
      </div>
    </div>
  );
}
