import "server-only";
import type frDictionary from "@/data/i18n/fr.json";
import type { Locale } from "./config";

export type Dictionary = typeof frDictionary;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("@/data/i18n/fr.json").then((module) => module.default),
  en: () => import("@/data/i18n/en.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
