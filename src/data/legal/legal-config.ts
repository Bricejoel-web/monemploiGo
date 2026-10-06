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
  // src/lib/pro/flag.ts). Date de mise en ligne du code (6 octobre 2026,
  // choix de l'utilisateur), qui inclut la mention du logo. Si
  // l'interrupteur n'est activé que bien plus tard, y inscrire la date
  // d'activation.
  proTermsLastUpdated: "6 octobre 2026",
  privacyWithProLastUpdated: "6 octobre 2026",
  privacyWithProLastUpdatedEn: "October 6, 2026",
  // Parrainage (affichés seulement quand REFERRAL_ENABLED=true). Date de mise
  // en ligne du code ; même remarque que pour Pro.
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
