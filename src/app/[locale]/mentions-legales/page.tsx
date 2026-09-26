import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";

export default async function LegalNoticePage({ params }: PageProps<"/[locale]/mentions-legales">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <LegalPage title={dict.legal.notice.title}>
      <p>{dict.legal.notice.content}</p>
    </LegalPage>
  );
}
