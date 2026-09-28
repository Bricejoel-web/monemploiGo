import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { TERMS_CONTENT } from "@/data/legal/terms-content";

export default async function TermsOfUsePage({ params }: PageProps<"/[locale]/conditions-utilisation">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalDocumentView document={TERMS_CONTENT[locale === "en" ? "en" : "fr"]} />;
}
