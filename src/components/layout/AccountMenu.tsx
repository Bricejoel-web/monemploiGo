"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Locale } from "@/i18n/config";

/**
 * Menu « Mon compte » (ordinateur, personne connectée) : regroupe ce qui
 * concerne le compte, pour que l'en-tête tienne sur une ligne. Le menu
 * principal garde « Tableau de bord » et « Parrainer & gagner ».
 */
export function AccountMenu({
  locale,
  name,
  email,
  labels,
  showReferral,
  showPro,
  showAdmin,
}: {
  locale: Locale;
  name: string | null;
  email: string;
  labels: { account: string; dashboard: string; logout: string };
  showReferral: boolean;
  showPro: boolean;
  showAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur et avec Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (name ?? email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?";
  const itemClass = "block rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.08]";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={labels.account}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-sm font-bold text-white shadow-sm ring-offset-2 transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#f2994a]"
      >
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-black/10 bg-background p-2 shadow-lg dark:border-white/15">
          <div className="border-b border-black/[0.06] px-3 pt-1 pb-2 dark:border-white/10">
            {name && <p className="truncate text-sm font-semibold">{name}</p>}
            <p className="truncate text-xs text-black/55 dark:text-white/55">{email}</p>
          </div>
          <div className="flex flex-col py-1" onClick={() => setOpen(false)}>
            <Link role="menuitem" href={`/${locale}/tableau-de-bord`} className={itemClass}>
              {labels.dashboard}
            </Link>
            {showReferral && (
              <Link role="menuitem" href="/fr/parrainage" className={itemClass}>
                Parrainer & gagner
              </Link>
            )}
            {showPro && (
              <Link role="menuitem" href="/fr/pro/connexion" className={itemClass}>
                Espace Pro
              </Link>
            )}
            {showAdmin && (
              <Link role="menuitem" href="/fr/admin/retraits" className={itemClass}>
                Administration
              </Link>
            )}
          </div>
          <div className="border-t border-black/[0.06] pt-1 dark:border-white/10">
            <LogoutButton locale={locale} label={labels.logout} />
          </div>
        </div>
      )}
    </div>
  );
}
