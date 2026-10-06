"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SESSION_HINT_COOKIE } from "@/lib/auth/session-hint";

export type SessionInfo = { loggedIn: false } | { loggedIn: true; name: string | null; email: string; isAdmin: boolean };

const hintSaysConnected = () => document.cookie.split("; ").includes(`${SESSION_HINT_COOKIE}=1`);

/** Bascule l'affichage (règles .si-connecte / .si-deconnecte de globals.css). */
export function markConnected(connected: boolean) {
  document.documentElement.dataset.connecte = connected ? "1" : "0";
  if (!connected) document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; path=/`;
}

// Une seule requête pour tout l'en-tête (ordinateur et mobile), refaite
// seulement quand l'indicateur change (connexion, déconnexion).
let request: Promise<SessionInfo> | null = null;
let requestedFor: boolean | null = null;

/**
 * Compte connecté, lu après l'affichage (null : pas encore connu). Revérifié
 * à chaque changement de page : une connexion ou une déconnexion par une
 * action serveur ne recharge pas la page.
 */
export function useSessionInfo(): SessionInfo | null {
  const pathname = usePathname();
  const [info, setInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let active = true;
    const connected = hintSaysConnected();
    document.documentElement.dataset.connecte = connected ? "1" : "0";
    if (requestedFor !== connected) {
      requestedFor = connected;
      request = connected
        ? fetch("/api/session", { cache: "no-store" })
            .then((r) => r.json() as Promise<SessionInfo>)
            .catch((): SessionInfo => ({ loggedIn: false }))
        : Promise.resolve<SessionInfo>({ loggedIn: false });
    }
    void request!.then((result) => {
      if (!active) return;
      if (connected && !result.loggedIn) {
        // Session expirée ou révoquée : retour à l'en-tête « déconnecté ».
        markConnected(false);
        requestedFor = false;
      }
      setInfo(result);
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  return info;
}
