import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { PRIVACY_CONTENT } from "@/data/legal/privacy-content";
import { withProPrivacy } from "@/data/legal/privacy-pro-content";
import { isProEnabled } from "@/lib/pro/flag";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/confidentialite">) {
  const { locale } = await params;
  return seoMetadata(locale, "privacy", "/confidentialite");
}

export default async function PrivacyPolicyPage({ params }: PageProps<"/[locale]/confidentialite">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const lang = locale === "en" ? "en" : "fr";
  // Les ajouts Pro ne sont publiés qu'une fois Pro réellement disponible.
  const document = isProEnabled() ? withProPrivacy(PRIVACY_CONTENT[lang], lang) : PRIVACY_CONTENT[lang];
  return <LegalDocumentView document={document} locale={locale} />;
}
