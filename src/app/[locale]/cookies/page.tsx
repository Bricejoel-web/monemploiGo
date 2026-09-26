import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";

export default async function CookiePolicyPage({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <LegalPage title={dict.legal.cookiePolicy.title}>
      <p>{dict.legal.cookiePolicy.content}</p>
    </LegalPage>
  );
}
