import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { INDEXABLE_PAGES, SITE_URL } from "@/lib/seo";

// Uniquement les pages publiques utiles, en français et en anglais, chacune
// avec ses alternatives de langue (hreflang). Voir INDEXABLE_PAGES.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return INDEXABLE_PAGES.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
