import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";
import { PRICE_FCFA, COVER_LETTER_PRICE_FCFA, BEWERBUNGSBRIEF_PRICE_FCFA } from "@/lib/cv/catalog";
import { seoMetadata } from "@/lib/seo-pages";

// Prix lus directement dans le catalogue : la page reste exacte quand les
// tarifs changent (voir src/lib/cv/catalog.ts).
const PRICES = [
  ["STANDARD", PRICE_FCFA.STANDARD],
  ["ATS", PRICE_FCFA.ATS],
  ["GERMAN_ATS", PRICE_FCFA.GERMAN_ATS],
  ["CANADA", PRICE_FCFA.CANADA],
  ["CANADA_ATS", PRICE_FCFA.CANADA_ATS],
  ["PREMIUM", PRICE_FCFA.PREMIUM],
  ["COVER_LETTER", COVER_LETTER_PRICE_FCFA],
  ["BEWERBUNGSBRIEF", BEWERBUNGSBRIEF_PRICE_FCFA],
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/tarifs">) {
  const { locale } = await params;
  const amounts = PRICES.map(([, price]) => price);
  return seoMetadata(locale, "pricing", "/tarifs", { vars: { minPrice: Math.min(...amounts), maxPrice: Math.max(...amounts) } });
}

export default async function PricingPage({ params }: PageProps<"/[locale]/tarifs">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const t = dict.pages.pricing;
  const format = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US");

  return (
    <LegalPage title={t.title}>
      <p>{t.intro}</p>

      <h2 className="font-semibold text-black dark:text-white">{t.tableTitle}</h2>
      <table className="w-full border-collapse overflow-hidden rounded-xl text-left">
        <tbody>
          {PRICES.map(([key, price]) => (
            <tr key={key} className="border-b border-black/10 last:border-0 dark:border-white/10">
              <th scope="row" className="py-2.5 pr-4 font-medium text-black/80 dark:text-white/80">
                {t.rows[key]}
              </th>
              <td className="py-2.5 text-right font-semibold whitespace-nowrap text-black dark:text-white">{format.format(price)} FCFA</td>
            </tr>
          ))}
        </tbody>
      </table>

      {[
        [t.paymentTitle, t.payment],
        [t.afterTitle, t.after],
        [t.problemsTitle, t.problems],
      ].map(([title, items]) => (
        <section key={title as string} className="flex flex-col gap-2">
          <h2 className="font-semibold text-black dark:text-white">{title as string}</h2>
          <ul className="list-disc pl-5">
            {(items as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={`/${locale}/cv`}
          className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25"
        >
          {t.cta}
        </Link>
        <Link href={`/${locale}/conditions-utilisation`} className="self-center text-sm font-medium underline">
          {t.termsLink}
        </Link>
      </div>
    </LegalPage>
  );
}
