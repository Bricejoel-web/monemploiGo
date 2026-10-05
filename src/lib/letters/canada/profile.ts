import type { Locale } from "@/i18n/config";
import type { CvData } from "@/lib/cv/types";

// Lettre de présentation Canada : structure commune aux trois sources
// d'informations (CV MonEmploiGo, CV importé, saisie manuelle). La lettre
// n'est générée qu'à partir de cette structure, toujours vérifiée par le
// candidat avant génération. Rien n'y est jamais deviné : une information
// absente reste vide.

export interface CandidateProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    city: string;
    country: string;
    linkedin?: string;
    website?: string;
  };
  professionalTitle: string;
  summary: string;
  skills: string[];
  experience: { role: string; company: string; location?: string; start: string; end: string; current: boolean; description: string }[];
  education: { degree: string; school: string; location?: string; period: string }[];
  certifications: { name: string; issuer: string; year?: string }[];
  languages: { name: string; level: string }[];
}

/** Informations propres à la candidature visée. */
export interface LetterJob {
  position: string;
  company: string;
  city?: string;
  province?: string;
  recruiterName?: string;
  offerText?: string;
  reference?: string;
  whyCompany?: string;
}

export interface LetterOptions {
  language: Locale;
  /** Disponibilité pour une mobilité vers le Canada : mentionnée seulement si « yes ». */
  mobility: "yes" | "no" | "omit";
}

export type ProfileSource = "monemploigo" | "import" | "manual";

/** Contenu enregistré d'une lettre de présentation Canada. */
export interface CanadaLetterContent {
  source: ProfileSource;
  profile: CandidateProfile;
  job: LetterJob;
  options: LetterOptions;
  date: string;
  /** Texte retouché par le candidat (remplace les paragraphes générés). */
  customParagraphs?: string[];
}

export const emptyProfile = (): CandidateProfile => ({
  personalInfo: { firstName: "", lastName: "", phone: "", email: "", city: "", country: "Cameroun" },
  professionalTitle: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
});

const PRESENT = ["présent", "present", "aujourd'hui", "heute", "en cours"];

/** Source 1 : un CV MonEmploiGo (quelle que soit sa catégorie). */
export function profileFromCv(cv: CvData): CandidateProfile {
  // « Prénom Nom » : le premier mot est le prénom, le reste le nom (modifiable à la vérification).
  const [firstName = "", ...rest] = cv.fullName.trim().split(/\s+/);
  const [city = "", ...countryParts] = (cv.address ?? "").split(",").map((p) => p.trim());
  return {
    personalInfo: {
      firstName,
      lastName: rest.join(" "),
      phone: cv.phone,
      email: cv.email,
      city,
      country: countryParts.join(", ") || "Cameroun",
      linkedin: cv.linkedin,
      website: cv.website,
    },
    professionalTitle: cv.jobTitle,
    summary: cv.summary,
    skills: cv.skills,
    experience: cv.experience.map((e) => ({
      role: e.role,
      company: e.company,
      location: e.location,
      start: e.start,
      end: e.end,
      current: PRESENT.includes(e.end.trim().toLowerCase()),
      description: e.description,
    })),
    education: cv.education.map((e) => ({ degree: e.degree, school: e.school, location: e.location, period: [e.start, e.end].filter(Boolean).join(" – ") })),
    certifications: cv.certifications ?? [],
    languages: cv.languages,
  };
}

// Source 2 : texte extrait d'un CV importé (PDF). Extraction par règles,
// jamais considérée comme fiable : seules les informations reconnues avec
// certitude sont remplies, le reste est signalé et laissé vide pour que le
// candidat le vérifie ou le complète.

const SECTION_PATTERNS: [keyof Pick<CandidateProfile, "summary" | "skills" | "experience" | "education" | "certifications" | "languages">, RegExp][] = [
  ["summary", /^(résumé professionnel|profil( professionnel)?|professional summary|summary|profile|à propos|about me)$/i],
  ["skills", /^(compétences( clés)?|skills|core skills|key skills)$/i],
  ["experience", /^(expériences? professionnelles?|expériences?|professional experience|work experience|experience)$/i],
  ["education", /^(formations?|éducation|education|diplômes)$/i],
  ["certifications", /^(certifications?|certificats?)$/i],
  ["languages", /^(langues|languages)$/i],
];

export interface ImportResult {
  profile: CandidateProfile;
  /** Rubriques non identifiées avec certitude, à vérifier par le candidat. */
  uncertain: string[];
}

export function profileFromImportedText(text: string): ImportResult {
  const profile = emptyProfile();
  const uncertain: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const flat = lines.join(" \n ");

  // Coordonnées : motifs fiables.
  profile.personalInfo.email = flat.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? "";
  profile.personalInfo.phone = flat.match(/\+?\d[\d ().-]{7,}\d/)?.[0].trim() ?? "";
  profile.personalInfo.linkedin = flat.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0];
  if (!profile.personalInfo.email) uncertain.push("e-mail");
  if (!profile.personalInfo.phone) uncertain.push("téléphone");

  // Découpage par titres de sections reconnus.
  const sections = new Map<string, string[]>();
  let current: string | null = null;
  const header: string[] = [];
  for (const line of lines) {
    const match = SECTION_PATTERNS.find(([, re]) => re.test(line.replace(/[:：]$/, "")));
    if (match) {
      current = match[0];
      sections.set(current, []);
    } else if (current) sections.get(current)!.push(line);
    else header.push(line);
  }

  // Nom : première ligne de l'en-tête, si elle ressemble à un nom (2 à 4 mots, sans chiffre ni @).
  const nameLine = header.find((l) => /^\p{L}[\p{L}' -]+$/u.test(l) && l.split(/\s+/).length >= 2 && l.split(/\s+/).length <= 4);
  if (nameLine) {
    const [first, ...rest] = nameLine.split(/\s+/);
    profile.personalInfo.firstName = first;
    profile.personalInfo.lastName = rest.join(" ");
    // Titre professionnel : ligne suivant le nom, si elle n'est pas une ligne de coordonnées.
    const next = header[header.indexOf(nameLine) + 1];
    if (next && !/[@\d|]/.test(next)) profile.professionalTitle = next;
  } else uncertain.push("nom");
  if (!profile.professionalTitle) uncertain.push("titre professionnel");

  // Ville, pays : segment « Ville, Pays » des coordonnées.
  const location = header.join(" | ").split("|").map((p) => p.trim()).find((p) => /^\p{L}[\p{L} '-]+, \p{L}[\p{L} '-]+$/u.test(p));
  if (location) [profile.personalInfo.city, profile.personalInfo.country] = location.split(",").map((p) => p.trim());
  else uncertain.push("ville et pays");

  const block = (key: string) => sections.get(key) ?? [];
  profile.summary = block("summary").join(" ");
  // Une ligne coupée par la mise en page du CV se recolle avec une espace.
  profile.skills = block("skills")
    .join(" ")
    .split(/[,·•;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);
  profile.languages = block("languages")
    .flatMap((l) => l.split(/[,·]/))
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, ...level] = l.split(/\s+[—:-]\s+|\s*:\s*/);
      return { name: name.trim(), level: level.join(" ").trim() };
    });
  // « Organisme — année » complète la certification précédente.
  for (const line of block("certifications")) {
    const detail = line.match(/^(.*?)\s*[—–-]\s*(\d{4})$/) ?? line.match(/^()(\d{4})$/);
    const last = profile.certifications.at(-1);
    if (detail && last && !last.issuer && !last.year) {
      last.issuer = detail[1].trim();
      last.year = detail[2];
    } else profile.certifications.push({ name: line, issuer: "" });
  }

  // Expériences et formations : le découpage en postes est trop incertain
  // pour être automatique. Le texte est conservé en un seul bloc, que le
  // candidat répartit à l'écran de vérification.
  if (block("experience").length) {
    profile.experience = [{ role: "", company: "", start: "", end: "", current: false, description: block("experience").join("\n") }];
    uncertain.push("détail des expériences (poste, entreprise, dates)");
  }
  if (block("education").length) {
    // Les dates éventuelles vont dans la période, pas dans l'intitulé du diplôme.
    const first = block("education")[0];
    const period = first.match(/(\d{2}\/)?\d{4}\s*[–-]\s*((\d{2}\/)?\d{4}|\p{L}+)$/u)?.[0] ?? "";
    profile.education = [{ degree: first.replace(period, "").trim(), school: "", period }];
    uncertain.push("détail de la formation");
  }
  const SECTION_NAMES: Record<string, string> = { summary: "résumé", skills: "compétences", experience: "expérience", education: "formation", languages: "langues" };
  for (const [key, name] of Object.entries(SECTION_NAMES)) {
    if (!sections.has(key)) uncertain.push(`rubrique « ${name} » introuvable`);
  }
  return { profile, uncertain };
}
