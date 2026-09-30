import "server-only";
import type { Metadata } from "next";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "./seo";

/**
 * Métadonnées d'une page à partir de ses textes `seo.<clé>` (fr.json /
 * en.json). Les repères {count}, {price}, {minPrice}, {maxPrice} sont
 * remplacés par les valeurs réelles du catalogue, formatées selon la langue :
 * les descriptions restent exactes quand les modèles ou les prix changent.
 */
export async function seoMetadata(
  rawLocale: string,
  key: keyof Dictionary["seo"],
  path: string,
  options: { vars?: Record<string, number>; noindex?: boolean; frenchOnly?: boolean } = {},
): Promise<Metadata> {
  const locale = options.frenchOnly ? "fr" : isLocale(rawLocale) ? rawLocale : defaultLocale;
  const { title, description } = (await getDictionary(locale)).seo[key];
  const format = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US");
  const fill = (text: string) =>
    text.replace(/\{(\w+)\}/g, (match, name: string) =>
      options.vars?.[name] !== undefined ? format.format(options.vars[name]) : match,
    );
  return pageMetadata({ locale, path, title: fill(title), description: fill(description), noindex: options.noindex, frenchOnly: options.frenchOnly });
}
