import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { TERMS_CONTENT } from "@/data/legal/terms-content";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/conditions-utilisation">) {
  const { locale } = await params;
  return seoMetadata(locale, "terms", "/conditions-utilisation");
}

export default async function TermsOfUsePage({ params }: PageProps<"/[locale]/conditions-utilisation">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalDocumentView document={TERMS_CONTENT[locale === "en" ? "en" : "fr"]} />;
}
