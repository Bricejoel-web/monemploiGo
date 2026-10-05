/**
 * Programme de parrainage « Parrainer & gagner » (voir docs/ROADMAP.md).
 * Seule source de vérité des montants et règles, toujours appliqués côté
 * serveur. Pas de `import "server-only"` : le proxy utilise aussi ce fichier.
 */

/** Tant que REFERRAL_ENABLED ne vaut pas "true", rien du parrainage n'est visible. */
export function isReferralEnabled(): boolean {
  return process.env.REFERRAL_ENABLED === "true";
}

/** Récompense fixe par document éligible acheté par une personne recommandée. */
export const REFERRAL_COMMISSION_FCFA = 200;
export const MIN_WITHDRAWAL_FCFA = 500;

/** Documents éligibles : tous ceux vendus à l'unité (CV et lettres). */
export const ELIGIBLE_DOCUMENT_TYPES = ["CV", "COVER_LETTER", "BEWERBUNGSBRIEF"] as const;

/** Domaines de recommandation (paramètre `domain` du lien). */
export const REFERRAL_DOMAINS = {
  cameroun: "CAMEROUN",
  allemagne: "ALLEMAGNE",
  canada: "CANADA",
  general: "GENERAL",
} as const;
export type ReferralDomainSlug = keyof typeof REFERRAL_DOMAINS;

export const domainSlug = (value: string | null | undefined): ReferralDomainSlug =>
  value && value in REFERRAL_DOMAINS ? (value as ReferralDomainSlug) : "general";

/** Attribution mémorisée à l'arrivée par un lien (cookie httpOnly, 30 jours). */
export const REFERRAL_COOKIE = "monemploigo_ref";
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/** Format d'un code de parrainage (ex. BRICE82). */
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

export function parseReferralCookie(value: string | undefined): { code: string; domain: ReferralDomainSlug } | null {
  if (!value) return null;
  const [code, domain] = value.split(":");
  return code && REFERRAL_CODE_PATTERN.test(code) ? { code, domain: domainSlug(domain) } : null;
}

/** Délai annoncé (décision de l'utilisateur du 2026-10-06 : 72 h, week-end compris). */
export const WITHDRAWAL_DELAY_TEXT = "Les demandes de retrait sont traitées manuellement dans un délai pouvant aller jusqu'à 72 heures, week-end compris.";
/** Dans l'administration, une demande en attente depuis plus longtemps est signalée en rouge. */
export const WITHDRAWAL_OVERDUE_HOURS = 48;
