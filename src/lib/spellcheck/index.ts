import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import nspell from "nspell";

/**
 * Correction orthographique automatique des champs de texte libre saisis
 * par l'utilisateur (résumé de CV, descriptions d'expérience, notes de
 * motivation, corps des lettres...), à la demande explicite de l'utilisateur
 * — "les erreurs d'orthographe commises par l'utilisateur [doivent être]
 * automatiquement corrigées [...] pour tout les documents, surtout
 * l'allemand".
 *
 * Fonctionne entièrement hors ligne, sans clé API ni coût, via de vrais
 * dictionnaires Hunspell (`dictionary-de`/`dictionary-fr`/`dictionary-en`)
 * chargés à la demande et mis en cache — cohérent avec le reste du site :
 * aucune fonctionnalité ne doit dépendre d'un service externe pour marcher.
 *
 * Portée volontairement limitée aux champs de PROSE libre (l'utilisateur y
 * rédige des phrases). Ne s'applique JAMAIS aux champs "identifiant" —
 * noms de personnes, d'établissements, de diplômes, de formations, de
 * villes — car y "corriger" un mot inconnu du dictionnaire (souvent un nom
 * propre, parfaitement correct) risquerait de dénaturer une information
 * réelle et importante du dossier de candidature.
 *
 * Les paquets `dictionary-*` exposent normalement leurs données via un
 * module ESM qui lit ses propres fichiers avec
 * `fs.readFile(new URL(..., import.meta.url))` — ce mécanisme casse une
 * fois regroupé dans un chunk de Server Action par Turbopack (`import.meta.url`
 * n'y résout plus vers un chemin de fichier valide). On lit donc directement
 * les fichiers `.aff`/`.dic` du paquet par un chemin classique, en
 * contournant le point d'entrée du paquet.
 */

export type SpellcheckLocale = "de" | "fr" | "en";

const DICTIONARY_PACKAGES: Record<SpellcheckLocale, string> = {
  de: "dictionary-de",
  fr: "dictionary-fr",
  en: "dictionary-en",
};

async function loadDictionaryFiles(packageName: string) {
  const base = path.join(process.cwd(), "node_modules", packageName);
  const [aff, dic] = await Promise.all([fs.readFile(path.join(base, "index.aff")), fs.readFile(path.join(base, "index.dic"))]);
  return { aff, dic };
}

const spellers: Partial<Record<SpellcheckLocale, Promise<ReturnType<typeof nspell>>>> = {};

async function getSpeller(locale: SpellcheckLocale) {
  if (!spellers[locale]) {
    spellers[locale] = (async () => {
      const { aff, dic } = await loadDictionaryFiles(DICTIONARY_PACKAGES[locale]);
      return nspell({ aff, dic });
    })();
  }
  return spellers[locale];
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// nspell classe ses suggestions par un score générique qui ne privilégie
// pas les corrections d'accent (ex. "tres" → sa 1ʳᵉ suggestion peut être
// "ares" plutôt que "très", pourtant évident) : on préfère donc toujours
// une suggestion qui ne diffère du mot saisi que par les accents, quand
// il y en a une, avant de se rabattre sur le classement brut de nspell.
function pickBestSuggestion(word: string, suggestions: string[]): string {
  const normalized = stripDiacritics(word).toLowerCase();
  const accentMatch = suggestions.find((s) => stripDiacritics(s).toLowerCase() === normalized);
  return accentMatch ?? suggestions[0];
}

function matchCase(suggestion: string, original: string): string {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return suggestion.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

// Mots (lettres/marques diacritiques/apostrophes/tirets), en laissant tout
// le reste (espaces, ponctuation, retours à la ligne) parfaitement intact.
const WORD_RE = /[\p{L}\p{M}'’-]+/gu;

// Auxiliaires être/avoir suivis d'un participe passé. « a » et « as » sont
// traités à part : « a » est souvent tapé à la place de « à » (« prêt a
// travailler »), on ne les retient qu'après un sujet.
const AUXILIARIES = "ai|avons|avez|ont|avais|avait|avions|aviez|avaient|aurai|aura|aurais|aurait|suis|es|est|sommes|êtes|sont|étais|était|étions|étiez|étaient|été|serai|sera|a|as";
const AUX_THEN_ER_RE = new RegExp(`(?<![\\p{L}])(${AUXILIARIES})\\s+([\\p{L}]{2,}er)(?![\\p{L}])`, "giu");
const SUBJECT_BEFORE_A = /(?:^|[^\p{L}])(il|elle|on|qui|ça|cela|tu)\s*$/iu;
// Noms ou adjectifs en -er dont la forme en -é existe aussi : « je suis
// conseiller », « il est fier » sont corrects.
const ER_WORDS_NOT_VERBS = new Set(["fier", "conseiller", "boucher", "cher", "hier", "premier", "dernier", "léger", "entier", "étranger", "amer", "super", "leader", "manager", "designer", "reporter"]);

/**
 * Faute fréquente qu'un dictionnaire ne voit pas (les deux mots existent) :
 * infinitif à la place du participe passé après être/avoir — « j'étais
 * charger », « j'ai travailler » → « chargé », « travaillé ». Renvoie des
 * suggestions (jamais appliquées d'office) ; la forme en -é doit exister
 * dans le dictionnaire, et le mot en -er y être un verbe connu.
 */
export async function findParticipleMistakes(text: string): Promise<{ wrong: string; fix: string }[]> {
  if (!text || !text.trim()) return [];
  let speller: Awaited<ReturnType<typeof getSpeller>>;
  try {
    speller = await getSpeller("fr");
  } catch {
    return [];
  }
  const found: { wrong: string; fix: string }[] = [];
  for (const match of text.matchAll(AUX_THEN_ER_RE)) {
    const [whole, aux, word] = match;
    const lower = word.toLocaleLowerCase("fr");
    if (ER_WORDS_NOT_VERBS.has(lower)) continue;
    if (/^as?$/i.test(aux) && !SUBJECT_BEFORE_A.test(text.slice(0, match.index))) continue;
    const participle = word.slice(0, -2) + (word.endsWith("ER") ? "É" : "é");
    if (!speller.correct(word) || !speller.correct(participle)) continue;
    const fix = whole.slice(0, whole.length - word.length) + participle;
    if (!found.some((f) => f.wrong === whole)) found.push({ wrong: whole, fix });
  }
  return found;
}

/**
 * Corrige l'orthographe d'un texte libre. Dégradation gracieuse : si le
 * dictionnaire ne peut pas être chargé pour une raison quelconque, le texte
 * original est renvoyé tel quel plutôt que de faire planter la génération
 * ou l'enregistrement du document.
 */
export async function correctSpelling(text: string, locale: SpellcheckLocale): Promise<string> {
  if (!text || !text.trim()) return text;

  let speller: Awaited<ReturnType<typeof getSpeller>>;
  try {
    speller = await getSpeller(locale);
  } catch (err) {
    console.error("[spellcheck] échec de chargement du dictionnaire", locale, err);
    return text;
  }

  return text.replace(WORD_RE, (word) => {
    // Mots trop courts ou contenant un chiffre : jamais touchés (trop de
    // faux positifs — sigles, références, unités...).
    if (word.length < 3 || /\d/.test(word)) return word;
    if (speller.correct(word)) return word;

    const suggestions = speller.suggest(word);
    if (suggestions.length === 0) return word;
    return matchCase(pickBestSuggestion(word, suggestions), word);
  });
}
