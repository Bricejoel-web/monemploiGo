import { notFound } from "next/navigation";
import { LegalDocumentView } from "@/components/layout/LegalDocumentView";
import { REFERRAL_TERMS_CONTENT } from "@/data/legal/referral-terms-content";
import { isReferralEnabled } from "@/lib/referral/config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/conditions-parrainage",
  title: "Conditions du programme Parrainer & gagner | monemploiGo",
  description: "Règles du programme de parrainage de MonEmploiGo : récompenses, retraits, remboursements.",
  frenchOnly: true,
});

// Page publique (lisible avant toute inscription), en français uniquement
// (/en/… redirigé par le proxy) et introuvable tant que le parrainage n'est
// pas activé.
export default function ReferralTermsPage() {
  if (!isReferralEnabled()) notFound();
  return <LegalDocumentView document={REFERRAL_TERMS_CONTENT} locale="fr" />;
}
