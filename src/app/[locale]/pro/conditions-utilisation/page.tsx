import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { PRO_TERMS_CONTENT } from "@/data/legal/pro-terms-content";
import { isProEnabled } from "@/lib/pro/flag";
import { seoMetadata } from "@/lib/seo-pages";

// Pro est en français uniquement : /en/pro/… est redirigé vers /fr/pro/…
// par le proxy, et toute l'arborescence /pro est introuvable tant que Pro
// n'est pas activé (voir src/proxy.ts et src/lib/pro/flag.ts).

export async function generateMetadata({ params }: PageProps<"/[locale]/pro/conditions-utilisation">) {
  const { locale } = await params;
  return seoMetadata(locale, "proTerms", "/pro/conditions-utilisation", { frenchOnly: true });
}

export default async function ProTermsPage({ params }: PageProps<"/[locale]/pro/conditions-utilisation">) {
  const { locale } = await params;
  if (!isLocale(locale) || !isProEnabled()) notFound();

  return <LegalDocumentView document={PRO_TERMS_CONTENT} locale="fr" />;
}
