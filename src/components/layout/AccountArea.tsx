"use client";

import { AccountMenu } from "./AccountMenu";
import { useSessionInfo } from "./session-client";
import type { Locale } from "@/i18n/config";

/**
 * Menu « Mon compte » des pages statiques : nom, e-mail et droit
 * d'administration chargés après l'affichage (/api/session). En attendant,
 * un cercle neutre de même taille (aucun décalage de la mise en page).
 */
export function AccountArea({
  locale,
  labels,
  showReferral,
  showPro,
}: {
  locale: Locale;
  labels: { account: string; dashboard: string; logout: string };
  showReferral: boolean;
  showPro: boolean;
}) {
  const info = useSessionInfo();
  if (!info?.loggedIn) return <span aria-hidden="true" className="block h-9 w-9 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />;
  return (
    <AccountMenu
      locale={locale}
      name={info.name}
      email={info.email}
      labels={labels}
      showReferral={showReferral}
      showPro={showPro}
      showAdmin={info.isAdmin}
    />
  );
}
