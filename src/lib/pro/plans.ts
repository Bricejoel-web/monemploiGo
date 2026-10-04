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

/**
 * Transactions qui prennent le verrou du compte Pro (création ou
 * réactivation de candidat, finalisation) : la seconde de deux opérations
 * simultanées attend la première. Le délai par défaut de Prisma (5 s) ne
 * suffisait pas (mesuré : page d'erreur au lieu du message « quota
 * atteint ») ; ces délais laissent la file se vider normalement.
 */
export const LOCKED_TRANSACTION = { maxWait: 10_000, timeout: 20_000 } as const;
