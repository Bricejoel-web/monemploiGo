import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { COVER_LETTER_PRICE_FCFA, PRICE_FCFA } from "@/lib/cv/catalog";
import { REFERRAL_COMMISSION_FCFA, domainSlug, isReferralEnabled, type ReferralDomainSlug } from "@/lib/referral/config";
import { pageMetadata } from "@/lib/seo";
import { CheckIcon, GlobeIcon } from "@/components/home/icons";
import { FlagCameroon, FlagCanada, FlagGermany, GiftIcon } from "@/components/referral/icons";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/recommandation",
  title: "Vous avez été recommandé sur monemploiGo",
  description: "Créez votre CV et votre lettre de motivation simplement, depuis votre téléphone.",
  noindex: true,
  frenchOnly: true,
});

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} FCFA`;
const minPrice = Math.min(...Object.values(PRICE_FCFA), COVER_LETTER_PRICE_FCFA);

// Uniquement des services réellement proposés aujourd'hui. Canada : CV
// seulement, jamais de document d'immigration.
const CONTENT: Record<ReferralDomainSlug, { flag: ReactNode; title: string; subtitle: string; services: string[]; note?: string; cta?: { label: string; href: string } }> = {
  cameroun: {
    flag: <FlagCameroon className="h-6 w-9" />,
    title: "Préparez votre candidature professionnelle",
    subtitle: "Créez votre CV et votre lettre de motivation pour vos candidatures au Cameroun.",
    services: ["CV professionnel : Standard, Premium ou ATS", "Lettre de motivation générée automatiquement à partir de vos informations"],
  },
  allemagne: {
    flag: <FlagGermany className="h-6 w-9" />,
    title: "Vous avez été recommandé sur MonEmploiGo",
    subtitle: "Préparez votre candidature pour votre projet professionnel en Allemagne.",
    services: ["CV Allemagne (ATS), au format Lebenslauf", "Bewerbungsbrief : la lettre de motivation allemande", "CV et lettre de motivation en français"],
    note: "MonEmploiGo vous aide à préparer vos documents de candidature. Ce n'est pas une agence d'immigration : aucun visa, emploi ou Ausbildung n'est garanti.",
  },
  canada: {
    flag: <FlagCanada className="h-6 w-12" />,
    title: "Vous avez été recommandé sur MonEmploiGo",
    subtitle: "Préparez votre candidature pour le Canada.",
    services: [
      "CV Canadien : présentez votre parcours de manière professionnelle pour vos candidatures au Canada.",
      "CV Canadien ATS : un modèle structuré pour les candidatures en ligne et une lecture claire par les systèmes ATS.",
      "Lettre de motivation Canada : accompagnez votre candidature avec une lettre claire et professionnelle.",
      "En français ou en anglais, au choix.",
    ],
    note: "MonEmploiGo est un service de préparation de documents de candidature. Nos documents ne sont pas des documents officiels délivrés par les autorités canadiennes et ne garantissent ni emploi, ni admission, ni visa, ni permis.",
    cta: { label: "Voir les CV Canada", href: "/fr/canada" },
  },
  general: {
    flag: <GlobeIcon className="h-7 w-7 text-[#16324f] dark:text-white" />,
    title: "Vous avez été recommandé sur MonEmploiGo",
    subtitle: "Créez vos documents de candidature professionnels simplement.",
    services: ["CV professionnel : Standard, Premium, ATS ou Allemagne", "Lettre de motivation et Bewerbungsbrief, générés automatiquement à partir de vos informations"],
  },
};

const BENEFITS = ["CV professionnel", "Lettre de motivation", "Création simple, étape par étape", "Utilisable depuis un téléphone", `Prix accessibles, à partir de ${fcfa(minPrice)}`];

export default async function ReferralLandingPage({ searchParams }: PageProps<"/[locale]/recommandation">) {
  if (!isReferralEnabled()) notFound();
  const { domaine } = await searchParams;
  const domain = domainSlug(typeof domaine === "string" ? domaine : undefined);
  const content = CONTENT[domain];

  return (
    <div className="bg-[#efe6d8] py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
        <section className="rounded-3xl bg-[#16324f] p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-3">
            {content.flag}
            <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">Vous avez été recommandé</span>
          </div>
          <h1 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl">{content.title}</h1>
          <p className="mt-2 text-white/80">{content.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/fr/inscription" className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#eb5757]/30">
              Créer mon CV
            </Link>
            <Link href={content.cta?.href ?? "/fr/cv"} className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {content.cta?.label ?? "Voir les modèles"}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Ce que vous pouvez créer</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {content.services.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {s}
              </li>
            ))}
          </ul>
          <ul className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/5">
                {b}
              </li>
            ))}
          </ul>
          {content.note && <p className="mt-4 text-xs text-black/60 dark:text-white/60">{content.note}</p>}
        </section>

        <section className="rounded-2xl border border-[#f2994a]/40 bg-[#fbfaf8] p-6 dark:border-[#f2994a]/30 dark:bg-white/[0.06]">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <GiftIcon className="h-5 w-5 text-[#eb5757]" />
            Pourquoi avez-vous reçu ce lien ?
          </h2>
          <div className="mt-2 flex flex-col gap-2 text-sm text-black/75 dark:text-white/75">
            <p>Vous avez été recommandé par un utilisateur de MonEmploiGo.</p>
            <p>
              Si vous achetez un CV ou une lettre de motivation éligible grâce à cette recommandation, cette personne recevra une récompense de {REFERRAL_COMMISSION_FCFA} FCFA par
              document éligible.
            </p>
            <p>Cette récompense n&apos;augmente pas le prix que vous payez.</p>
            <p>Vous êtes totalement libre d&apos;utiliser ou non MonEmploiGo.</p>
            <p>
              <Link href="/fr/conditions-parrainage" className="font-medium underline">
                Conditions du programme de recommandation
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
