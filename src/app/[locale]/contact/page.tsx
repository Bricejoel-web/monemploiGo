import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL_CONFIG } from "@/data/legal/legal-config";
import { MailIcon } from "@/components/home/icons";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  return seoMetadata(locale, "contact", "/contact");
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = (await getDictionary(locale as Locale)).pages.contact;

  return (
    <LegalPage title={t.title}>
      <p>{t.intro}</p>
      <a
        href={`mailto:${LEGAL_CONFIG.contactEmail}`}
        className="flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25"
      >
        <MailIcon className="h-4 w-4" />
        {LEGAL_CONFIG.contactEmail}
      </a>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-black dark:text-white">{t.tipsTitle}</h2>
        <ul className="list-disc pl-5">
          {t.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
      <p className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">{t.safety}</p>
      <Link href={`/${locale}/tarifs`} className="w-fit font-medium underline">
        {t.pricingLink}
      </Link>
    </LegalPage>
  );
}
