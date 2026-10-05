import type { Locale } from "@/i18n/config";

/** "18 octobre 2026" / "October 18, 2026" ; en français, "1er novembre 2026". */
export function formatLongDate(date: Date | string, locale: Locale): string {
  const formatted = new Date(date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return locale === "fr" ? formatted.replace(/^1 /, "1er ") : formatted;
}

/** Nombre de jours calendaires restants avant `date` (0 = aujourd'hui). */
export function daysUntil(date: Date | string, now = new Date()): number {
  const target = new Date(date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);
}
