import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";

export default async function PrivacyPolicyPage({ params }: PageProps<"/[locale]/confidentialite">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const p = dict.legal.privacy;

  return (
    <LegalPage title={p.title}>
      <p>{p.intro}</p>
      <h2 className="font-semibold text-black dark:text-white">{p.dataTitle}</h2>
      <p>{p.dataContent}</p>
      <h2 className="font-semibold text-black dark:text-white">{p.paymentTitle}</h2>
      <p>{p.paymentContent}</p>
      <h2 className="font-semibold text-black dark:text-white">{p.cookiesTitle}</h2>
      <p>{p.cookiesContent}</p>
      <h2 className="font-semibold text-black dark:text-white">{p.rightsTitle}</h2>
      <p>{p.rightsContent}</p>
    </LegalPage>
  );
}
