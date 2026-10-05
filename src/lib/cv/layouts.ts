import type { CvLayoutId, CoverLetterLayoutConfig, BewerbungsbriefLayoutId } from "./types";

// 3 mises en page Standard — validées avec l'utilisateur (voir docs/ROADMAP.md)
export const standardLayouts: CvLayoutId[] = ["std-classique", "std-deux-colonnes", "std-bandeau"];

// 4 mises en page Premium — validées avec l'utilisateur
export const premiumLayouts: CvLayoutId[] = [
  "prem-cercles",
  "prem-triangles",
  "prem-vagues",
  "prem-pilules",
  "prem-facettes",
  "prem-diagonale",
  "prem-banniere",
  "prem-vague-laterale",
];

// 3 mises en page ATS — toutes en une seule colonne, noir sur blanc, sans
// icône ni couleur d'accent (voir docs/ROADMAP.md, décision "CV ATS
// monochromes") : seule la disposition change d'un modèle à l'autre.
export const atsLayouts: CvLayoutId[] = ["ats-executif", "ats-minimal", "ats-compact"];

// 3 mises en page Allemagne — même principe (catégorie GERMAN_ATS),
// correspondant à trois conventions réelles de Lebenslauf allemand :
// tabellarisch (tableau date/libellé), par blocs narratifs, et compact.
export const germanAtsLayouts: CvLayoutId[] = ["de-tabellarisch", "de-blockschema", "de-kompakt"];

const clBase = (overrides: Partial<CoverLetterLayoutConfig> & { key: string }): CoverLetterLayoutConfig => ({
  headingStyle: "plain",
  showSenderBlock: "left",
  ...overrides,
});

// 5 mises en page Bewerbungsbrief — chacune une vraie variante structurelle
// DIN 5008 (voir docs/ROADMAP.md, recherche "Bewerbungsschreiben Ausbildung"),
// pas une simple recoloration : bb-din-klassisch (DIN 5008 strict),
// bb-modern-kopf (bandeau d'en-tête personnel), bb-tabellen-kopf
// (expéditeur/destinataire en mini-tableau), bb-anlagen-liste (Anlagen en
// liste à puces), bb-kompakt (interlignage resserré, Betreff majuscules).
export const bewerbungsbriefLayouts: BewerbungsbriefLayoutId[] = [
  "bb-din-klassisch",
  "bb-modern-kopf",
  "bb-tabellen-kopf",
  "bb-anlagen-liste",
  "bb-kompakt",
];

// 10 archétypes — Lettres de motivation (inchangé pour l'instant)
export const coverLetterLayouts: CoverLetterLayoutConfig[] = [
  clBase({ key: "cl-classic-block", headingStyle: "block", showSenderBlock: "left" }),
  clBase({ key: "cl-modern-left", headingStyle: "underline", showSenderBlock: "left" }),
  clBase({ key: "cl-modern-right", headingStyle: "underline", showSenderBlock: "right" }),
  clBase({ key: "cl-minimal", headingStyle: "plain", showSenderBlock: "left" }),
  clBase({ key: "cl-elegant-serif", headingStyle: "uppercase-tracked", showSenderBlock: "left" }),
  clBase({ key: "cl-executive", headingStyle: "block", showSenderBlock: "right" }),
  clBase({ key: "cl-creative-header", headingStyle: "uppercase-tracked", showSenderBlock: "right" }),
  clBase({ key: "cl-compact", headingStyle: "plain", showSenderBlock: "left" }),
  clBase({ key: "cl-formal-din", headingStyle: "block", showSenderBlock: "left" }),
  clBase({ key: "cl-friendly-modern", headingStyle: "underline", showSenderBlock: "right" }),
];
