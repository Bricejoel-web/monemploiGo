"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Locale } from "@/i18n/config";

// Sur mobile, les liens de navigation principaux (dont "Tableau de bord")
// étaient entièrement masqués (`hidden md:flex`) sans aucun menu de
// remplacement : un utilisateur sur téléphone n'avait donc aucun moyen direct
// d'atteindre le tableau de bord depuis une page profonde (catalogue,
// éditeur...) autre que le bouton retour natif — qui retrace tout
// l'historique de navigation accumulé plutôt que d'y aller directement,
// donnant l'impression de "tourner en boucle" entre deux pages.
export function MobileNav({
  locale,
  cvLabel,
  coverLettersLabel,
  bewerbungsbriefLabel,
  dashboardLabel,
  loginLabel,
  signupLabel,
  logoutLabel,
  isLoggedIn,
}: {
  locale: Locale;
  cvLabel: string;
  coverLettersLabel: string;
  bewerbungsbriefLabel: string;
  dashboardLabel: string;
  loginLabel: string;
  signupLabel: string;
  logoutLabel: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  const linkClass =
    "block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]";

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-black/[0.06] bg-background/95 backdrop-blur-md px-4 py-3 shadow-md dark:border-white/10">
          <nav className="flex flex-col gap-1">
            <Link href={`/${locale}/cv`} className={linkClass} onClick={() => setOpen(false)}>
              {cvLabel}
            </Link>
            <Link href={`/${locale}/lettres-de-motivation`} className={linkClass} onClick={() => setOpen(false)}>
              {coverLettersLabel}
            </Link>
            <Link href={`/${locale}/bewerbungsbrief`} className={linkClass} onClick={() => setOpen(false)}>
              {bewerbungsbriefLabel}
            </Link>
            {isLoggedIn ? (
              <>
                <Link href={`/${locale}/tableau-de-bord`} className={linkClass} onClick={() => setOpen(false)}>
                  {dashboardLabel}
                </Link>
                <div className="border-t border-black/[0.06] pt-1 dark:border-white/10">
                  <LogoutButton locale={locale} label={logoutLabel} />
                </div>
              </>
            ) : (
              <div className="mt-1 flex flex-col gap-1 border-t border-black/[0.06] pt-2 dark:border-white/10">
                <Link href={`/${locale}/connexion`} className={linkClass} onClick={() => setOpen(false)}>
                  {loginLabel}
                </Link>
                <Link
                  href={`/${locale}/inscription`}
                  className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-3 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  {signupLabel}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
