import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { LEGAL_CONFIG } from "@/data/legal/legal-config";

/**
 * Adresse officielle du site, utilisée pour toutes les URL absolues
 * (canonical, hreflang, Open Graph, sitemap, données structurées).
 * Le jour où un nom de domaine est acheté : changer `siteUrl` dans
 * legal-config.ts, déclarer le domaine comme principal dans Vercel (avec
 * redirection 301 depuis monemploigo.vercel.app) — voir
 * docs/seo/rapport-audit-seo-2026-09-29.md.
 */
export const SITE_URL = LEGAL_CONFIG.siteUrl;
export const SITE_NAME = "monemploiGo";

/**
 * Métadonnées d'une page publique : titre et description propres à la page,
 * URL canonique, versions linguistiques (hreflang, `x-default` = français),
 * Open Graph et carte Twitter/X. L'image de partage vient du fichier
 * `src/app/[locale]/opengraph-image.tsx`, hérité par toutes les pages.
 *
 * `path` : chemin SANS la langue, commençant par "/" ("" pour l'accueil).
 * `noindex` : pages sans valeur de recherche (connexion, inscription…).
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  // Indiquée explicitement : l'image générée par opengraph-image.tsx n'est
  // appliquée automatiquement qu'à l'accueil, car l'objet `openGraph` de
  // chaque page remplace entièrement celui hérité (fusion superficielle).
  const image = { url: `${SITE_URL}/${locale}/opengraph-image`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr${path}`,
        en: `${SITE_URL}/en${path}`,
        "x-default": `${SITE_URL}/fr${path}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url,
      title,
      description,
      locale: locale === "fr" ? "fr_CM" : "en_CM",
      alternateLocale: locale === "fr" ? ["en_CM"] : ["fr_CM"],
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Pages publiques indexables (chemins sans la langue), dans l'ordre
 * d'importance. Source unique du sitemap : toute nouvelle page publique
 * utile doit être ajoutée ici. Les pages privées (tableau de bord,
 * paiement, aperçus, éditeurs de modèles) et sans valeur de recherche
 * (connexion, inscription) n'y figurent jamais.
 */
export const INDEXABLE_PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/cv", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cv/standard", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cv/premium", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cv/ats", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cv/allemagne", priority: 0.8, changeFrequency: "monthly" },
  { path: "/lettres-de-motivation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/bewerbungsbrief", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tarifs", priority: 0.6, changeFrequency: "monthly" },
  { path: "/a-propos", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/conditions-utilisation", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.1, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.1, changeFrequency: "yearly" },
];

/**
 * Identité de MonEmploiGo pour Google (schema.org Organization). Uniquement
 * des faits établis : nom, site, logo, e-mail. `sameAs` restera vide tant
 * qu'aucun profil officiel (Facebook, LinkedIn…) n'existe réellement.
 */
export function organizationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "MonEmploiGo",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: LEGAL_CONFIG.contactEmail,
    description,
    areaServed: { "@type": "Country", name: "Cameroun" },
  };
}

/** Le site lui-même (accueil). Pas de SearchAction : il n'y a pas de recherche interne. */
export function websiteJsonLd(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    description,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Fil d'Ariane : doit reproduire exactement celui affiché sur la page. */
export function breadcrumbJsonLd(items: { name: string; path: string }[], locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.path}`,
    })),
  };
}
