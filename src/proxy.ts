import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { SESSION_COOKIE, decryptSessionToken } from "@/lib/auth/session";
import { isCategorySlug } from "@/lib/cv/category-routes";

const LOCALE_COOKIE = "NEXT_LOCALE";
const PROTECTED_SEGMENTS = ["tableau-de-bord", "paiement", "document"];
const AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS = ["connexion", "inscription"];
// Éditeurs de modèles (/cv/modele/…, /lettres-de-motivation/modele/…,
// /bewerbungsbrief/modele/…) : réservés aux utilisateurs connectés.
const EDITOR_PATH = /^\/(fr|en)\/(cv|lettres-de-motivation|bewerbungsbrief)\/modele\//;
// Pages sans valeur de recherche ou privées : jamais indexées.
const NOINDEX_SEGMENTS = [...PROTECTED_SEGMENTS, ...AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS];

/**
 * Pourquoi ces redirections sont faites ici et pas seulement dans les pages :
 * `src/app/[locale]/loading.tsx` fait envoyer chaque page en flux dès la
 * première seconde ; un `redirect()` appelé ensuite dans la page ne peut
 * plus changer le statut HTTP, et devenait une page « 200 » vide avec une
 * redirection différée (`meta refresh`) — que Google explorait et risquait
 * d'indexer (≈ 318 URL : éditeurs, paiements, aperçus). Ici, la redirection
 * 307 part avant tout rendu. La vérification stricte de la session reste
 * faite ensuite côté serveur (src/lib/auth/dal.ts).
 */

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());

  const match = preferred.find((lang) => isLocale(lang));
  return match ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;

    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // Vérification optimiste (basée sur le cookie, sans requête base de
  // données) : suffisante pour rediriger rapidement, la vérification stricte
  // se fait ensuite côté serveur (voir src/lib/auth/dal.ts).
  const [, locale, ...rest] = pathname.split("/");
  const segment = rest[0];
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSessionToken(token);

  const isEditor = EDITOR_PATH.test(pathname);

  // Catégorie de CV inconnue (/fr/cv/xyz) : vraie page 404 (statut 404,
  // page bilingue), au lieu d'une page envoyée en flux en « 200 » avec le
  // message anglais par défaut. Réécriture vers une adresse sans page, que
  // global-not-found.tsx prend en charge.
  if (segment === "cv" && rest.length === 2 && !isCategorySlug(rest[1])) {
    return NextResponse.rewrite(new URL(`/${locale}/404`, request.url));
  }

  if ((PROTECTED_SEGMENTS.includes(segment) || isEditor) && !session?.userId) {
    return NextResponse.redirect(new URL(`/${locale}/connexion`, request.url));
  }

  if (AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS.includes(segment) && session?.userId) {
    return NextResponse.redirect(new URL(`/${locale}/tableau-de-bord`, request.url));
  }

  const response = NextResponse.next();
  if (NOINDEX_SEGMENTS.includes(segment) || isEditor) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
