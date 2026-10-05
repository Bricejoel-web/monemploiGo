import { isReferralEnabled } from "@/lib/referral/config";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";
import { seoMetadata } from "@/lib/seo-pages";

// Décrit uniquement ce que le site dépose réellement (vérifié dans le code le
// 2026-09-29 : cookies de session et de langue, stockage local de trois
// préférences). À mettre à jour si un outil de mesure d'audience ou tout
// autre cookie est ajouté un jour.
export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  return seoMetadata(locale, "cookies", "/cookies");
}

export default async function CookiePolicyPage({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const policy = (await getDictionary(locale as Locale)).legal.cookiePolicy;

  return (
    <LegalPage title={policy.title}>
      <p>{policy.intro}</p>
      <ul className="list-disc pl-5">
        {policy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {/* Parrainage : publié seulement quand le programme est activé. */}
        {isReferralEnabled() && (
          <li>
            {locale === "en"
              ? "« monemploigo_ref »: remembers the referral link followed, so it can be attributed to the account created; technical cookie, not used for advertising, removed once the account is created (30 days)."
              : "« monemploigo_ref » : mémorise le lien de recommandation suivi, pour l'attribuer au compte créé ; cookie technique, non publicitaire, retiré une fois le compte créé (30 jours)."}
          </li>
        )}
      </ul>
      {policy.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </LegalPage>
  );
}
