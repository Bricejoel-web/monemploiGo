import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import nspell from "nspell";

/**
 * Suggestions d'orthographe et de grammaire pour les textes libres des
 * éditeurs (profil, descriptions, lettres), affichées au client qui les
 * accepte ou non — JAMAIS appliquées d'office.
 *
 * Historique (2026-09-29) :
 *   1. Une correction automatique et silencieuse était appliquée à
 *      l'enregistrement. Elle remplaçait tout mot inconnu du dictionnaire,
 *      y compris logiciels, marques et lieux (« Excel » → « Excellé »,
 *      « Word » → « Bord », « MTN » → « MAN », « Buea » → « Beta ») et, en
 *      allemand, des mots justes : `nspell` interprète mal les règles du
 *      dictionnaire allemand, surtout les mots composés (« Zusammenarbeit »
 *      → « Zusammenarbeite », « gut » → « Gut »). Elle a été retirée.
 *   2. Le dictionnaire français met ~20 s à se charger avec `nspell`, en
 *      bloquant le serveur (y compris l'enregistrement du client) : il n'est
 *      plus utilisé. Le français repose sur des règles et une liste de
 *      fautes fréquentes, instantanées et sans fausse alerte.
 *
 * Donc :
 *   - français : participe passé après être/avoir (« j'étais charger ») +
 *     fautes fréquentes des CV (accents oubliés : « tres », « experience ») ;
 *   - anglais : dictionnaire (chargement ~0,4 s), mots en minuscules
 *     seulement — un nom propre, une marque, un sigle n'est jamais visé ;
 *   - allemand : majuscule en début de phrase (règle sûre).
 */

// ---------- anglais : dictionnaire ----------

let englishSpeller: Promise<ReturnType<typeof nspell>> | undefined;
function getEnglishSpeller() {
  // Lecture directe des fichiers .aff/.dic : le point d'entrée du paquet
  // (`import.meta.url`) ne fonctionne plus une fois regroupé par Turbopack.
  englishSpeller ??= (async () => {
    const base = path.join(process.cwd(), "node_modules", "dictionary-en");
    const [aff, dic] = await Promise.all([fs.readFile(path.join(base, "index.aff")), fs.readFile(path.join(base, "index.dic"))]);
    return nspell({ aff, dic });
  })();
  return englishSpeller;
}

const WORD_RE = /[\p{L}\p{M}'’-]+/gu;
// Une suggestion coûte jusqu'à ~1 s : on s'arrête après quelques mots.
const MAX_ENGLISH_SUGGESTIONS = 4;

async function findEnglishSpelling(text: string): Promise<{ wrong: string; fix: string }[]> {
  let speller: Awaited<ReturnType<typeof getEnglishSpeller>>;
  try {
    speller = await getEnglishSpeller();
  } catch (err) {
    console.error("[spellcheck] échec de chargement du dictionnaire anglais", err);
    return [];
  }
  const found: { wrong: string; fix: string }[] = [];
  for (const [word] of text.matchAll(WORD_RE)) {
    if (found.length >= MAX_ENGLISH_SUGGESTIONS) break;
    if (word.length < 4 || word !== word.toLowerCase() || /['’]/.test(word)) continue;
    if (speller.correct(word) || found.some((f) => f.wrong === word)) continue;
    if (word.includes("-")) {
      const parts = word.split("-").filter(Boolean);
      if (parts.some((p) => p.length <= 2) || parts.every((p) => speller.correct(p))) continue;
    }
    const fix = speller.suggest(word)[0];
    if (fix && fix !== word) found.push({ wrong: word, fix });
  }
  return found;
}

// ---------- français : règles ----------

// Fautes les plus fréquentes dans les CV (souvent des accents oubliés en
// tapant sur téléphone). Liste fermée : aucune fausse alerte possible.
const FRENCH_COMMON_MISTAKES: Record<string, string> = {
  tres: "très", apres: "après", deja: "déjà", etre: "être", ete: "été", voila: "voilà", ca: "ça", meme: "même", plutot: "plutôt",
  experience: "expérience", experiences: "expériences", experiance: "expérience", equipe: "équipe", equipes: "équipes",
  competence: "compétence", competences: "compétences", qualite: "qualité", qualites: "qualités", capacite: "capacité",
  capacites: "capacités", responsabilite: "responsabilité", responsabilites: "responsabilités", activite: "activité",
  activites: "activités", societe: "société", securite: "sécurité", sante: "santé", hopital: "hôpital", ecole: "école",
  college: "collège", lycee: "lycée", universite: "université", etudes: "études", etude: "étude", etudiant: "étudiant",
  etudiante: "étudiante", diplomee: "diplômée", baccalaureat: "baccalauréat", reussite: "réussite", francais: "français",
  francaise: "française", developpement: "développement", developper: "développer", gerer: "gérer", reseau: "réseau",
  reseaux: "réseaux", numerique: "numérique", electricite: "électricité", mecanique: "mécanique", electronique: "électronique",
  comptabilite: "comptabilité", medecine: "médecine", medical: "médical", medicale: "médicale", reference: "référence",
  references: "références", periode: "période", annee: "année", annees: "années", generale: "générale", general: "général",
  interessee: "intéressée", interet: "intérêt", precis: "précis", precise: "précise", serieux: "sérieux", serieuse: "sérieuse",
  dinamique: "dynamique", dinamisme: "dynamisme", motivee: "motivée", rigoureu: "rigoureux", creatif: "créatif",
  creative: "créative", creativite: "créativité", ponctualite: "ponctualité", fiabilite: "fiabilité", realisee: "réalisée",
  realiser: "réaliser", realisation: "réalisation", creer: "créer", creation: "création", resolution: "résolution",
  negociation: "négociation", strategie: "stratégie", strategique: "stratégique", preparation: "préparation",
  reception: "réception", receptionniste: "réceptionniste", secretaire: "secrétaire", secretariat: "secrétariat",
  employe: "employé", employee: "employée", redaction: "rédaction", presentation: "présentation", telephone: "téléphone",
  telephonique: "téléphonique", methode: "méthode", methodique: "méthodique", theorique: "théorique", pedagogie: "pédagogie",
  benevole: "bénévole", benevolat: "bénévolat", deplacement: "déplacement", disponibilite: "disponibilité",
  immediate: "immédiate", infirmiere: "infirmière",
};

// Auxiliaires être/avoir suivis d'un participe passé. « a » et « as » ne
// comptent qu'après un sujet : « a » est souvent tapé à la place de « à »
// (« prêt a travailler »).
const AUXILIARIES = "ai|avons|avez|ont|avais|avait|avions|aviez|avaient|aurai|aura|aurais|aurait|suis|es|est|sommes|êtes|sont|étais|était|étions|étiez|étaient|été|serai|sera|a|as";
const AUX_THEN_ER_RE = new RegExp(`(?<![\\p{L}])(${AUXILIARIES})\\s+([\\p{L}]{2,}er)(?![\\p{L}])`, "giu");
const SUBJECT_BEFORE_A = /(?:^|[^\p{L}])(il|elle|on|qui|ça|cela|tu)\s*$/iu;
// Noms et adjectifs en -er (« je suis boulanger », « il est premier ») :
// jamais signalés.
const ER_NOT_VERBS = new Set([
  "premier", "dernier", "fier", "cher", "hier", "léger", "entier", "étranger", "amer", "super", "mer", "fer", "hiver", "cancer", "laser",
  "leader", "manager", "designer", "reporter", "poster", "boulanger", "boucher", "berger", "horloger", "passager", "messager", "danger",
  "potager", "verger", "clocher", "rocher", "plancher", "conseiller", "footballeur", "dealer", "trader", "planner", "developer",
]);
// Mots en -ier : presque tous des noms (infirmier, ouvrier, cuisinier…) ;
// seuls ces verbes courants sont retenus.
const IER_VERBS = new Set([
  "étudier", "oublier", "vérifier", "modifier", "confier", "copier", "publier", "trier", "remercier", "apprécier", "négocier", "associer",
  "simplifier", "identifier", "justifier", "certifier", "classifier", "diversifier", "planifier", "qualifier", "spécifier", "unifier",
  "signifier", "multiplier", "amplifier", "clarifier", "rectifier", "notifier", "lier", "plier", "prier", "crier", "nier", "envier",
  "marier", "varier", "relier", "rallier", "initier", "licencier", "financer",
]);

/**
 * Infinitif à la place du participe passé après être/avoir — faute qu'un
 * dictionnaire ne voit pas (« charger » existe) : « j'étais charger »,
 * « j'ai travailler » → « chargé », « travaillé ». Instantané, sans
 * dictionnaire.
 */
export function findParticipleMistakes(text: string): { wrong: string; fix: string }[] {
  if (!text || !text.trim()) return [];
  const found: { wrong: string; fix: string }[] = [];
  for (const match of text.matchAll(AUX_THEN_ER_RE)) {
    const [whole, aux, word] = match;
    const lower = word.toLocaleLowerCase("fr");
    if (ER_NOT_VERBS.has(lower)) continue;
    if (lower.endsWith("ier") && !IER_VERBS.has(lower)) continue;
    if (/^as?$/i.test(aux) && !SUBJECT_BEFORE_A.test(text.slice(0, match.index))) continue;
    const participle = word.slice(0, -2) + (word.endsWith("ER") ? "É" : "é");
    const fix = whole.slice(0, whole.length - word.length) + participle;
    if (!found.some((f) => f.wrong === whole)) found.push({ wrong: whole, fix });
  }
  return found;
}

/** Fautes fréquentes (liste fermée), mots en minuscules seulement. */
function findFrenchCommonMistakes(text: string): { wrong: string; fix: string }[] {
  const found: { wrong: string; fix: string }[] = [];
  for (const [word] of text.matchAll(/[\p{L}]+/gu)) {
    const fix = FRENCH_COMMON_MISTAKES[word];
    if (fix && fix !== word && !found.some((f) => f.wrong === word)) found.push({ wrong: word, fix });
  }
  return found;
}

// ---------- allemand ----------

/**
 * Allemand : phrase qui ne commence pas par une majuscule (« … gearbeitet.
 * ich möchte … »). Le premier mot du texte n'est jamais visé : dans une
 * lettre, le corps commence en minuscule après « Sehr geehrte Damen und
 * Herren, ».
 */
export function findGermanCapitalizationMistakes(text: string): { wrong: string; fix: string }[] {
  if (!text || !text.trim()) return [];
  const found: { wrong: string; fix: string }[] = [];
  for (const match of text.matchAll(/(?<=[.!?]\s+)(\p{Ll}[\p{L}]*)/gu)) {
    const word = match[1];
    const fix = word[0].toUpperCase() + word.slice(1);
    if (!found.some((f) => f.wrong === word)) found.push({ wrong: word, fix });
  }
  return found;
}

const FRENCH_MARKERS = new Set(["le", "la", "les", "des", "du", "et", "est", "une", "un", "je", "j", "dans", "pour", "avec", "que", "qui", "sur", "au", "aux", "mon", "ma", "mes", "suis", "ai", "pas", "ce", "cette", "nous", "vous", "l", "d", "en", "à", "été", "très"]);
const GERMAN_MARKERS = new Set(["der", "die", "das", "und", "ich", "ist", "nicht", "mit", "für", "ein", "eine", "einen", "im", "zu", "auf", "habe", "bin", "den", "dem", "des", "von", "sie", "wir", "mich", "mein", "meine", "als", "bei", "auch", "sehr", "gerne", "möchte"]);

/**
 * Langue probable d'un court texte, d'après ses petits mots courants
 * (« le, et, je… » contre « der, und, ich… »). Instantané, sans dictionnaire.
 * Sert à ne pas coller des notes écrites en français dans une lettre allemande.
 */
export function detectGermanOrFrench(text: string): "de" | "fr" | "unknown" {
  const words = (text.toLowerCase().match(/[\p{L}]+/gu) ?? []).slice(0, 200);
  const fr = words.filter((w) => FRENCH_MARKERS.has(w)).length;
  const de = words.filter((w) => GERMAN_MARKERS.has(w)).length;
  if (fr >= 2 && fr > de) return "fr";
  if (de >= 2 && de > fr) return "de";
  return "unknown";
}

// ---------- point d'entrée ----------

/** Toutes les suggestions pour un texte, selon sa langue. */
export async function findSuggestions(text: string, language: string): Promise<{ wrong: string; fix: string }[]> {
  if (!text || !text.trim()) return [];
  if (language === "de") return findGermanCapitalizationMistakes(text);
  if (language === "en") return findEnglishSpelling(text);
  if (language === "fr") {
    const grammar = findParticipleMistakes(text);
    // Un mot déjà couvert par une suggestion de grammaire n'est pas proposé deux fois.
    return [...grammar, ...findFrenchCommonMistakes(text).filter((s) => !grammar.some((g) => g.wrong.includes(s.wrong)))];
  }
  return [];
}
