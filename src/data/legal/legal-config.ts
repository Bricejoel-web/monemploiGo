/**
 * Coordonnées et métadonnées légales de MonEmploiGo — centralisées ici pour
 * pouvoir être mises à jour en un seul endroit (voir CGU, section Contact).
 *
 * `contactEmail`/`contactPhone`/`contactAddress` restent volontairement des
 * placeholders tant que l'identité juridique de l'entreprise n'est pas
 * définie : ne jamais les remplacer par une valeur inventée, y compris à
 * titre d'exemple — voir docs/ROADMAP.md.
 */
export const LEGAL_CONFIG = {
  // Date réelle de publication de cette version des CGU (pas une donnée
  // fictive) — sert aussi de numéro de version stocké sur le compte de
  // chaque utilisateur au moment où il les accepte (voir User.termsVersion).
  lastUpdated: "26 septembre 2026",
  contactEmail: "[e-mail à compléter]",
  contactPhone: "[numéro à compléter]",
  contactAddress: "[adresse à compléter]",
};

export const TERMS_VERSION = LEGAL_CONFIG.lastUpdated;
