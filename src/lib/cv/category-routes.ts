import type { CvCategory } from "./types";

export const CATEGORY_SLUGS: Record<CvCategory, string> = {
  STANDARD: "standard",
  PREMIUM: "premium",
  ATS: "ats",
  GERMAN_ATS: "allemagne",
  CANADA: "canada",
  CANADA_ATS: "canada-ats",
};

export const SLUG_TO_CATEGORY: Record<string, CvCategory> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([category, slug]) => [slug, category as CvCategory]),
);

export function isCategorySlug(slug: string): slug is string {
  return slug in SLUG_TO_CATEGORY;
}

/** Clé du nom de chaque catégorie dans `dict.dashboard` (fr.json / en.json). */
export const CATEGORY_LABEL_KEYS = {
  STANDARD: "standard",
  PREMIUM: "premium",
  ATS: "ats",
  GERMAN_ATS: "germanAts",
  CANADA: "canada",
  CANADA_ATS: "canadaAts",
} as const satisfies Record<CvCategory, string>;
