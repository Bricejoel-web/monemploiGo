"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isProPrivatePath } from "@/lib/pro/navigation";

/**
 * L'espace Pro privé a sa propre navigation (ProShell) : l'en-tête, le
 * bandeau d'informations et le pied de page du site particulier n'y sont pas
 * affichés. Partout ailleurs, rien ne change.
 */
export function HideInProSpace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isProPrivatePath(pathname) ? null : children;
}
