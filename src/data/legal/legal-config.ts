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
  contactEmail: "monemploigo.contact@gmail.com",
  siteUrl: "https://monemploigo.vercel.app",
  contactPhone: "[numéro à compléter]",
  contactAddress: "[adresse à compléter]",
};

export const TERMS_VERSION = LEGAL_CONFIG.lastUpdated;
