"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

const STORAGE_KEY = "monemploigo_cookie_consent";

export function CookieConsent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        // localStorage indisponible (navigation privée) : on n'affiche pas la bannière.
      }
    });
  }, []);

  const respond = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="print-hide fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-background/95 p-4 backdrop-blur dark:border-white/15">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-black/70 dark:text-white/70">
          {dict.cookies.message}{" "}
          <Link href={`/${locale}/cookies`} className="underline">
            {dict.cookies.learnMore}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => respond("declined")}
            className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold dark:border-white/20"
          >
            {dict.cookies.decline}
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            {dict.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
