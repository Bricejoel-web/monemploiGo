/**
 * Coordonnées et métadonnées légales de MonEmploiGo — centralisées ici pour
 * pouvoir être mises à jour en un seul endroit (voir CGU, section Contact).
 *
 * `contactEmail` : adresse fournie par l'utilisateur dans les CGU du
 * 2026-09-29 (c'est aussi le compte Gmail qui envoie les e-mails du site).
 * `contactPhone`/`contactAddress` restent volontairement des placeholders
 * tant que l'identité juridique de l'entreprise n'est pas définie (les CGU
 * actuelles ne les mentionnent plus) : ne jamais les remplacer par une valeur
 * inventée, y compris à titre d'exemple — voir docs/ROADMAP.md.
 */
export const LEGAL_CONFIG = {
  // Date réelle de publication de cette version des CGU (pas une donnée
  // fictive) — sert aussi de numéro de version stocké sur le compte de
  // chaque utilisateur au moment où il les accepte (voir User.termsVersion).
  lastUpdated: "29 septembre 2026",
  // Même date, pour la version anglaise des CGU (affichage uniquement).
  lastUpdatedEn: "September 29, 2026",
  // Politique de confidentialité : date propre, indépendante de la version
  // des CGU enregistrée à l'inscription.
  privacyLastUpdated: "29 septembre 2026",
  privacyLastUpdatedEn: "September 29, 2026",
  // MonEmploiGo Pro (affichés seulement quand PRO_ENABLED=true, voir
  // src/lib/pro/flag.ts). À REMPLACER par la date réelle de mise en ligne de
  // Pro le jour où l'interrupteur est activé en production.
  proTermsLastUpdated: "30 septembre 2026",
  privacyWithProLastUpdated: "30 septembre 2026",
  privacyWithProLastUpdatedEn: "September 30, 2026",
  // Parrainage (affichés seulement quand REFERRAL_ENABLED=true). À REMPLACER
  // par la date réelle de lancement du programme.
  referralTermsLastUpdated: "6 octobre 2026",
  privacyWithReferralLastUpdated: "6 octobre 2026",
  privacyWithReferralLastUpdatedEn: "October 6, 2026",
  contactEmail: "monemploigo.contact@gmail.com",
  siteUrl: "https://monemploigo.vercel.app",
  contactPhone: "[numéro à compléter]",
  contactAddress: "[adresse à compléter]",
};

export const TERMS_VERSION = LEGAL_CONFIG.lastUpdated;

/** Version des CGU Pro, enregistrée sur l'espace Pro à son acceptation. */
export const PRO_TERMS_VERSION = LEGAL_CONFIG.proTermsLastUpdated;
