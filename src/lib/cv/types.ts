import type { Locale } from "@/i18n/config";

export type CvCategory = "STANDARD" | "PREMIUM" | "ATS" | "GERMAN_ATS" | "CANADA" | "CANADA_ATS";

// Chaque id correspond à un composant de mise en page dédié et
// entièrement dessiné à la main (voir src/components/cv/layouts/) —
// validés un par un avec l'utilisateur avant intégration.
export type CvLayoutId =
  | "std-classique"
  | "std-deux-colonnes"
  | "std-bandeau"
  | "prem-cercles"
  | "prem-triangles"
  | "prem-vagues"
  | "prem-pilules"
  | "prem-facettes"
  | "prem-diagonale"
  | "prem-banniere"
  | "prem-vague-laterale"
  | "ats-executif"
  | "ats-minimal"
  | "ats-compact"
  | "de-tabellarisch"
  | "de-blockschema"
  | "de-kompakt"
  // CV Canada : un identifiant par modèle du registre (can-std-01 à
  // can-std-21, can-ats-01 à can-ats-20), tous rendus par le même moteur
  // (src/components/cv/canada/CanadaCv.tsx).
  | `can-${string}`;

export interface CvTheme {
  key: string;
  name: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  headingFont: "sans" | "serif";
  bodyFont: "sans" | "serif";
}

export interface CvExperienceEntry {
  role: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  description: string;
}

export interface CvEducationEntry {
  degree: string;
  school: string;
  location?: string;
  start: string;
  end: string;
  description?: string;
}

export interface CvData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address?: string;
  summary: string;
  photoDataUrl?: string | null;
  // Facteur d'agrandissement de la photo choisi par l'utilisateur (1 = taille
  // par défaut de la mise en page). Optionnel : absent sur les documents
  // enregistrés avant l'ajout de ce réglage, `?? 1` à l'affichage.
  photoScale?: number;
  experience: CvExperienceEntry[];
  education: CvEducationEntry[];
  skills: string[];
  languages: { name: string; level: string }[];
  extras?: { title: string; content: string }[];
  // Champs attendus dans un Lebenslauf allemand classique (catégorie
  // GERMAN_ATS — candidatures de formation/Ausbildung, notamment Pflege),
  // rarement utilisés dans les autres pays et donc optionnels ici pour ne
  // pas alourdir les autres catégories de CV.
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  // Champs des CV Canada (catégories CANADA et CANADA_ATS), tous
  // facultatifs : langue du document, indépendante de celle du site, liens
  // professionnels et certifications structurées. Jamais d'autorisation de
  // travail ni de statut d'immigration : rien n'est ajouté que
  // l'utilisateur n'a pas saisi.
  cvLanguage?: Locale;
  linkedin?: string;
  website?: string;
  certifications?: CvCertification[];
}

export interface CvCertification {
  name: string;
  issuer: string;
  year?: string;
}

export interface CvTemplateMeta {
  id: string;
  slug: string;
  name: string;
  category: CvCategory;
  priceFcfa: number;
  layoutId: CvLayoutId;
  theme: CvTheme;
  supportsPhoto: boolean;
  /** Groupe d'affichage dans le catalogue (famille des modèles Canada). */
  group?: string;
}

export interface CoverLetterData {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  recipientName?: string;
  recipientCompany?: string;
  date: string;
  subject: string;
  body: string;
  // Champs structurés optionnels, utilisés pour générer automatiquement le
  // corps de la lettre (voir src/lib/ai/cover-letter.ts) — le champ `body`
  // reste la seule source de vérité affichée sur le document, ces champs ne
  // servent qu'à la génération et restent facultatifs pour ne pas casser les
  // lettres déjà enregistrées avant l'ajout de cette fonctionnalité.
  jobTitle?: string;
  sourceOfListing?: string;
  yearsOfExperience?: string;
  keySkills?: string;
  motivationNotes?: string;
}

export interface CoverLetterLayoutConfig {
  key: string;
  headingStyle: "underline" | "block" | "uppercase-tracked" | "plain";
  showSenderBlock: "left" | "right";
}

export interface CoverLetterTemplateMeta {
  id: string;
  slug: string;
  name: string;
  priceFcfa: number;
  layout: CoverLetterLayoutConfig;
  theme: CvTheme;
}

// Bewerbungsbrief : lettre de motivation allemande pour les candidatures de
// formation (Ausbildung, notamment Pflege), distincte de CoverLetterData —
// l'utilisateur ne rédige pas de texte libre, il saisit ses informations et
// ses attestations de formation, et le corps de la lettre (Einleitung /
// Hauptteil / Schluss) est généré automatiquement (voir
// src/lib/ai/bewerbungsbrief.ts), puis reste éditable.
export type BewerbungsbriefLayoutId =
  | "bb-din-klassisch"
  | "bb-modern-kopf"
  | "bb-tabellen-kopf"
  | "bb-anlagen-liste"
  | "bb-kompakt";

export interface BewerbungsbriefQualification {
  title: string;
  institution: string;
  date: string;
}

export interface BewerbungsbriefData {
  // Absender
  fullName: string;
  address: string;
  phone: string;
  email: string;
  // Empfänger / cible
  recipientInstitution: string;
  recipientAddress?: string;
  recipientContactName?: string;
  city: string;
  date: string;
  targetProgram: string;
  referenceNumber?: string;
  sourceOfListing?: string;
  // Attestations de formation
  qualifications: BewerbungsbriefQualification[];
  languageLevel: string;
  motivationNotes?: string;
  availabilityDate?: string;
  attachments: string[];
  body: string;
}

export interface BewerbungsbriefTemplateMeta {
  id: string;
  slug: string;
  name: string;
  priceFcfa: number;
  layoutId: BewerbungsbriefLayoutId;
  theme: CvTheme;
}
