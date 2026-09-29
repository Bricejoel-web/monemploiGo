/**
 * Vérifications de qualité d'un CV, affichées comme simples conseils dans
 * l'éditeur (jamais bloquantes : le client peut toujours enregistrer et
 * payer — décision de l'utilisateur, 2026-09-29). Fonctions pures, utilisables
 * côté navigateur.
 */

// Petits mots qui restent en minuscules dans un nom propre (« Université de
// Douala », « Lycée Bilingue de Bonabéri », « Ludwig van Beethoven »).
const LOWERCASE_PARTICLES = new Set(["de", "du", "des", "la", "le", "les", "et", "à", "au", "aux", "en", "sur", "von", "van", "der", "den", "und", "of", "the", "and", "da", "di", "d", "l"]);

const capitalize = (word: string) => word.charAt(0).toLocaleUpperCase("fr") + word.slice(1);

/**
 * Majuscule à chaque mot d'un nom (personne, établissement, ville) :
 * « fotsing brice » → « Fotsing Brice », « jean-pierre » → « Jean-Pierre ».
 * Seuls les mots entièrement en minuscules sont modifiés : ce que le client
 * a déjà écrit avec des majuscules (« eBay », « IUT ») reste intact.
 */
export function capitalizeWords(value: string): string {
  let first = true;
  return value.replace(/[\p{L}\p{M}]+/gu, (word, offset: number, whole: string) => {
    const isFirst = first;
    first = false;
    if (word !== word.toLocaleLowerCase("fr")) return word;
    // Après une apostrophe (« d'Ivoire », « l'Université ») : majuscule.
    const afterApostrophe = offset > 0 && /['’]/.test(whole[offset - 1]);
    if (!isFirst && !afterApostrophe && LOWERCASE_PARTICLES.has(word)) return word;
    if (afterApostrophe && LOWERCASE_PARTICLES.has(word)) return word;
    return capitalize(word);
  });
}

/** Majuscule au premier mot seulement (intitulé de poste, diplôme) : « professeur » → « Professeur ». */
export function capitalizeFirst(value: string): string {
  const match = value.match(/[\p{L}\p{M}]+/u);
  if (!match || match.index === undefined) return value;
  const word = match[0];
  if (word !== word.toLocaleLowerCase("fr")) return value;
  return value.slice(0, match.index) + capitalize(word) + value.slice(match.index + word.length);
}

export type DateIssue = "endBeforeStart" | "startFuture" | "endFuture" | "sameMonth";

/** "MM/AAAA" → nombre de mois (comparable), sinon null (vide, « présent »…). */
function monthIndex(value: string): number | null {
  const m = value.trim().match(/^(\d{2})\/(\d{4})$/);
  return m ? Number(m[2]) * 12 + Number(m[1]) - 1 : null;
}

/** Incohérences de dates d'une expérience ou d'une formation. */
export function dateIssues(start: string, end: string, now: Date = new Date()): DateIssue[] {
  const s = monthIndex(start);
  const e = monthIndex(end);
  const current = now.getFullYear() * 12 + now.getMonth();
  const issues: DateIssue[] = [];
  if (s !== null && e !== null && e < s) issues.push("endBeforeStart");
  if (s !== null && s > current) issues.push("startFuture");
  if (e !== null && e > current) issues.push("endFuture");
  if (s !== null && e !== null && s === e) issues.push("sameMonth");
  return issues;
}

/** Adresse qui n'en est pas une : « 00000 », « 123 », « - ». */
export function isSuspiciousAddress(value: string | undefined): boolean {
  const v = (value ?? "").trim();
  return v.length > 0 && !/\p{L}/u.test(v);
}
