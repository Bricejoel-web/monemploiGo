import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { PRIVACY_CONTENT } from "@/data/legal/privacy-content";

export default async function PrivacyPolicyPage({ params }: PageProps<"/[locale]/confidentialite">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalDocumentView document={PRIVACY_CONTENT[locale === "en" ? "en" : "fr"]} />;
}
