/**
 * Offre MonEmploiGo Pro Starter — seule source de vérité des prix et quotas
 * (CGU Pro, articles 5 à 11). Toujours lue côté serveur : le navigateur ne
 * fixe jamais un prix, un quota ou un statut.
 */
export const PRO_STARTER = {
  name: "Pro Starter",
  priceFcfa: 5000,
  currency: "XAF",
  periodDays: 30,
  maxActiveCandidates: 10,
  maxDocumentsPerPeriod: 30,
} as const;

/** Lecture seule après expiration, avant suppression des données (CGU Pro, art. 11). */
export const READ_ONLY_DAYS = 90;

/** À partir de cette part du quota utilisée : « Vous approchez de votre limite ». */
export const QUOTA_WARNING_RATIO = 0.8;

export const DAY_MS = 24 * 60 * 60 * 1000;
