import type { CvCategory } from "@/lib/cv/types";

/**
 * Types de documents proposés dans l'espace Pro : uniquement ceux qui
 * existent réellement sur MonEmploiGo (mêmes modèles, mêmes générateurs).
 */
export const PRO_DOCUMENT_KINDS = [
  { slug: "standard", label: "CV Standard", description: "Sobres et efficaces.", kind: "CV", category: "STANDARD" },
  { slug: "premium", label: "CV Premium", description: "Un design qui se démarque.", kind: "CV", category: "PREMIUM" },
  { slug: "ats", label: "CV ATS", description: "Lus par les logiciels de recrutement.", kind: "CV", category: "ATS" },
  { slug: "allemagne", label: "CV Allemagne (ATS)", description: "Au format Lebenslauf.", kind: "CV", category: "GERMAN_ATS" },
  { slug: "lettre", label: "Lettre de motivation", description: "Générée automatiquement à partir de vos informations.", kind: "COVER_LETTER", category: null },
  { slug: "bewerbungsbrief", label: "Bewerbungsbrief", description: "La lettre de motivation allemande.", kind: "BEWERBUNGSBRIEF", category: null },
] as const satisfies readonly { slug: string; label: string; description: string; kind: "CV" | "COVER_LETTER" | "BEWERBUNGSBRIEF"; category: CvCategory | null }[];

export type ProDocumentKind = (typeof PRO_DOCUMENT_KINDS)[number];

export const proDocumentKind = (slug: string) => PRO_DOCUMENT_KINDS.find((k) => k.slug === slug);

/** Libellé d'un document existant (type + catégorie de CV). */
export function documentLabel(type: "CV" | "COVER_LETTER" | "BEWERBUNGSBRIEF", category: CvCategory | null): string {
  if (type === "COVER_LETTER") return "Lettre de motivation";
  if (type === "BEWERBUNGSBRIEF") return "Bewerbungsbrief";
  return PRO_DOCUMENT_KINDS.find((k) => k.kind === "CV" && k.category === category)?.label ?? "CV";
}
