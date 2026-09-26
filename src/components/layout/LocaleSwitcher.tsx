"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { persistLocaleCookie } from "@/i18n/locale-cookie";

const LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (locale: Locale) => {
    if (locale === currentLocale) return;
    persistLocaleCookie(locale);
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${locale}${rest ? `/${rest}` : ""}`);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 p-1 text-sm dark:border-white/15">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === currentLocale}
          className={`rounded-full px-3 py-1 transition-colors ${
            locale === currentLocale
              ? "bg-foreground text-background"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
