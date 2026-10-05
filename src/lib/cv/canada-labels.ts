import type { Locale } from "@/i18n/config";
import type { CvData } from "./types";

// Titres des CV Canada. La langue est celle choisie pour le document
// (français ou anglais), indépendamment de la langue de l'interface.
// Ordre des sections validé par l'utilisateur (2026-10-06) : nom, titre,
// coordonnées, résumé, compétences, expérience, formation, certifications,
// langues. Rien n'est ajouté que l'utilisateur n'a pas saisi.
export const canadaCvLabels: Record<Locale, {
  summary: string;
  skills: string;
  experience: string;
  education: string;
  certifications: string;
  languages: string;
  present: string;
  namePlaceholder: string;
  jobTitlePlaceholder: string;
}> = {
  fr: {
    summary: "Résumé professionnel",
    skills: "Compétences",
    experience: "Expérience professionnelle",
    education: "Formation",
    certifications: "Certifications",
    languages: "Langues",
    present: "Présent",
    namePlaceholder: "Votre nom",
    jobTitlePlaceholder: "Titre professionnel",
  },
  en: {
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Professional Experience",
    education: "Education",
    certifications: "Certifications",
    languages: "Languages",
    present: "Present",
    namePlaceholder: "Your name",
    jobTitlePlaceholder: "Professional title",
  },
};

// Niveaux de langue proposés dans le formulaire, dans la langue du CV.
// Les niveaux CECR (A1 à C2) sont conservés tels quels.
export const CANADA_LEVELS: Record<Locale, string[]> = {
  fr: ["Débutant", "Intermédiaire", "Avancé", "Courant", "Langue maternelle"],
  en: ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"],
};
export const CEFR_LEVELS_FULL = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Niveaux génériques déjà proposés ailleurs dans le site (fr.json / en.json),
// ramenés à leur équivalent dans la langue du CV.
const LEVEL_ALIASES: Record<string, number> = {
  "débutant": 0, "beginner": 0, "notions": 0,
  "intermédiaire": 1, "intermediate": 1,
  "avancé": 2, "advanced": 2, "expert": 2,
  "courant": 3, "fluent": 3, "bilingue": 3, "bilingual": 3,
  "langue maternelle": 4, "native": 4, "natif": 4, "maternelle": 4,
};

/** Niveau de langue dans la langue du CV (texte libre et CECR inchangés). */
export function localizeLevel(level: string, locale: Locale): string {
  const index = LEVEL_ALIASES[level.trim().toLowerCase()];
  return index === undefined ? level.trim() : CANADA_LEVELS[locale][index];
}

const PRESENT_VALUES = ["présent", "present", "heute", "aujourd'hui", "en cours"];

/** Date de fin affichée : « Présent » dans la langue du CV pour un poste en cours. */
export function displayEnd(end: string, locale: Locale): string {
  return PRESENT_VALUES.includes(end.trim().toLowerCase()) ? canadaCvLabels[locale].present : end;
}

export function dateRange(start: string, end: string, locale: Locale): string {
  const to = displayEnd(end, locale);
  return [start, to].filter((v) => v.trim()).join(" – ");
}

// Tri du plus récent au plus ancien. Les dates sont saisies au format
// MM/AAAA (voir CvEditor) ; un poste en cours passe en premier. Une date
// illisible garde la place choisie par l'utilisateur (tri stable).
function recency(start: string, end: string): number | null {
  if (PRESENT_VALUES.includes(end.trim().toLowerCase())) return Number.MAX_SAFE_INTEGER;
  const parse = (v: string) => {
    const m = v.trim().match(/^(?:(\d{1,2})\/)?(\d{4})$/);
    return m ? Number(m[2]) * 12 + (m[1] ? Number(m[1]) : 12) : null;
  };
  return parse(end) ?? parse(start);
}

export function byRecency<T extends { start: string; end: string }>(items: T[]): T[] {
  const keyed = items.map((item, index) => ({ item, index, key: recency(item.start, item.end) }));
  // Les entrées sans date lisible restent à leur position relative.
  const dated = keyed.filter((k) => k.key !== null).sort((a, b) => b.key! - a.key! || a.index - b.index);
  let next = 0;
  return keyed.map((k) => (k.key === null ? k.item : dated[next++].item));
}

/** Réalisations d'un poste : une ligne saisie = une puce (tirets retirés). */
export function achievementLines(description: string): string[] {
  return description
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/** Liens affichés sans « https:// » ni « www. », tels que saisis sinon. */
export const displayUrl = (url: string) => url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

/** Coordonnées dans l'ordre validé : localisation, téléphone, e-mail, LinkedIn, portfolio. */
export function contactItems(data: CvData): string[] {
  return [data.address, data.phone, data.email, data.linkedin && displayUrl(data.linkedin), data.website && displayUrl(data.website)]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
}

export const certificationsOf = (data: CvData) => (data.certifications ?? []).filter((c) => c.name.trim());
export const certificationDetail = (c: { issuer: string; year?: string }) => [c.issuer, c.year].map((v) => (v ?? "").trim()).filter(Boolean).join(" — ");
export const languageLine = (l: { name: string; level: string }, locale: Locale) => (l.level.trim() ? `${l.name} — ${localizeLevel(l.level, locale)}` : l.name);

export const hasExperience = (data: CvData) => data.experience.some((e) => e.role.trim() || e.company.trim());
export const hasEducation = (data: CvData) => data.education.some((e) => e.degree.trim() || e.school.trim());
