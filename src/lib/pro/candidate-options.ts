/**
 * Listes de choix du dossier candidat, partagées entre le formulaire et la
 * vérification côté serveur (une valeur hors liste est refusée).
 * « Type de candidature » décrit la démarche du candidat : MonEmploiGo ne
 * l'accompagne pas lui-même et ne garantit aucun résultat (CGU Pro, art. 2).
 */
export const APPLICATION_TYPES = ["Emploi", "Stage", "Alternance", "Ausbildung", "Études", "Volontariat", "Autre"] as const;

export const EDUCATION_LEVELS = [
  "Sans diplôme",
  "CEP / BEPC / CAP",
  "Probatoire",
  "Baccalauréat / GCE A Level",
  "BTS / DUT / HND",
  "Licence / Bachelor",
  "Master",
  "Doctorat",
  "Autre",
] as const;

export const GERMAN_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/** Suggestions seulement : le pays reste un champ libre. */
export const COUNTRY_SUGGESTIONS = ["Allemagne", "Autriche", "Suisse", "Belgique", "Canada", "France", "Luxembourg", "Royaume-Uni", "Cameroun"];

const GERMAN_SPEAKING = ["allemagne", "autriche", "suisse"];

/** Le niveau d'allemand n'est demandé que lorsqu'il est pertinent. */
export function germanLevelRelevant(destinationCountry: string, applicationType: string): boolean {
  const country = destinationCountry.trim().toLowerCase();
  return applicationType === "Ausbildung" || GERMAN_SPEAKING.some((c) => country.startsWith(c));
}
