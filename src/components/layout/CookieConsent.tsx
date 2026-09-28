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

  // Simple information : le site ne dépose que des cookies strictement
  // nécessaires (connexion, langue), il n'y a donc aucun consentement à
  // recueillir. L'ancienne bannière « Accepter / Refuser » demandait un
  // accord pour des cookies non essentiels qui n'existaient pas. Si un outil
  // de mesure d'audience est ajouté un jour, il faudra revenir à un vrai
  // choix, et ne charger cet outil qu'après acceptation.
  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "acknowledged");
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
        <button
          type="button"
          onClick={acknowledge}
          className="shrink-0 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background"
        >
          {dict.cookies.acknowledge}
        </button>
      </div>
    </div>
  );
}
