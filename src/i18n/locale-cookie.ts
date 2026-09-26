"use client";

import type { Locale } from "./config";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function persistLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
}
