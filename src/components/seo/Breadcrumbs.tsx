import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

/**
 * Fil d'Ariane visible + le même en données structurées (BreadcrumbList) :
 * Google exige que le balisage reproduise exactement ce qui est affiché.
 * Le dernier élément (page courante) n'est pas un lien.
 */
export function Breadcrumbs({ items, locale, label }: { items: { name: string; path: string }[]; locale: Locale; label: string }) {
  return (
    <>
      <nav aria-label={label}>
        <ol className="flex flex-wrap items-center gap-1 text-sm text-black/60 dark:text-white/60">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-black/80 dark:text-white/80">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={`/${locale}${item.path}`} className="transition-colors hover:text-[#c94f30] dark:hover:text-[#f2994a]">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">›</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items, locale)} />
    </>
  );
}
