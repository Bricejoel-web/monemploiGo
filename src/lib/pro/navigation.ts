/**
 * Rubriques de l'espace Pro. `available: false` : rubrique pas encore
 * construite (voir les phases dans docs/ROADMAP.md) — affichée grisée avec
 * « Bientôt », jamais sous forme de lien qui mènerait à une page vide.
 * Passer à `true` quand la phase correspondante est livrée.
 */
export const PRO_NAV = [
  { href: "/fr/pro/dashboard", label: "Tableau de bord", icon: "home", available: true },
  { href: "/fr/pro/candidats", label: "Mes candidats", icon: "users", available: true },
  { href: "/fr/pro/documents", label: "Documents", icon: "document", available: true },
  { href: "/fr/pro/candidats/nouveau", label: "Nouveau candidat", icon: "plus", available: true },
  { href: "/fr/pro/abonnement", label: "Mon abonnement", icon: "card", available: false },
  { href: "/fr/pro/parametres", label: "Paramètres", icon: "settings", available: false },
  { href: "/fr/pro/aide", label: "Aide", icon: "help", available: true },
] as const;

export type ProNavIcon = (typeof PRO_NAV)[number]["icon"];

export const proNavItem = (href: (typeof PRO_NAV)[number]["href"]) => PRO_NAV.find((item) => item.href === href)!;

/**
 * Segments privés de l'espace Pro (/fr/pro/<segment>) : connexion
 * obligatoire (proxy), jamais indexés, sans l'en-tête ni le pied de page du
 * site particulier.
 */
export const PRO_PRIVATE_SEGMENTS = ["dashboard", "candidats", "documents", "abonnement", "parametres", "aide"];

export function isProPrivatePath(pathname: string): boolean {
  const [, locale, segment, sub] = pathname.split("/");
  return (locale === "fr" || locale === "en") && segment === "pro" && PRO_PRIVATE_SEGMENTS.includes(sub);
}
