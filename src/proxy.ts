import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { SESSION_COOKIE, decryptSessionToken } from "@/lib/auth/session";
import { isCategorySlug } from "@/lib/cv/category-routes";
import { isProEnabled } from "@/lib/pro/flag";
import { PRO_PRIVATE_SEGMENTS } from "@/lib/pro/navigation";
import { REFERRAL_CODE_PATTERN, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, domainSlug, isReferralEnabled } from "@/lib/referral/config";

const LOCALE_COOKIE = "NEXT_LOCALE";
const PROTECTED_SEGMENTS = ["tableau-de-bord", "paiement", "document", "parrainage", "admin", "lettre-canada"];
// Parrainage (français uniquement) : introuvable tant que REFERRAL_ENABLED
// n'est pas activé. « admin » ne contient pour l'instant que les retraits
// de parrainage (accès réservé aux e-mails de ADMIN_EMAILS, vérifié par la page).
const REFERRAL_SEGMENTS = ["parrainage", "recommandation", "admin", "conditions-parrainage"];
const AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS = ["connexion", "inscription"];
// Éditeurs de modèles (/cv/modele/…, /lettres-de-motivation/modele/…,
// /bewerbungsbrief/modele/…) : réservés aux utilisateurs connectés.
const EDITOR_PATH = /^\/(fr|en)\/(cv|lettres-de-motivation|bewerbungsbrief)\/modele\//;
// Mot de passe oublié : accessible connecté ou non, jamais indexé.
const PASSWORD_RESET_SEGMENTS = ["mot-de-passe-oublie", "reinitialiser-mot-de-passe"];
// Pages sans valeur de recherche ou privées : jamais indexées.
const NOINDEX_SEGMENTS = [...PROTECTED_SEGMENTS, ...AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS, ...PASSWORD_RESET_SEGMENTS, "recommandation"];
// Espace Pro (/fr/pro/…) : pages privées (connexion obligatoire) et pages
// publiques indexables ; tout le reste (connexion, inscription) : noindex.

const PRO_INDEXABLE_SEGMENTS = [undefined, "conditions-utilisation"];

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

  // Lien de recommandation (?ref=CODE&domain=…) : le code et le domaine sont
  // mémorisés 30 jours dans un cookie illisible par le navigateur (le premier
  // lien suivi compte), puis la personne arrive sur la page adaptée au
  // domaine. Le code n'est vérifié qu'à l'inscription (src/lib/referral).
  // Exception : la page de retour de paiement reçoit aussi un paramètre
  // `ref` (référence du paiement, voir le `callback` de notchpay.ts). Sans
  // cette exception, chaque retour de Notch Pay était détourné vers la page
  // de recommandation dès que le parrainage était activé, sans vérification
  // du paiement au retour.
  const ref = request.nextUrl.searchParams.get("ref");
  const isPaymentReturn = /^\/(?:(?:fr|en)\/)?paiement\/retour\/?$/.test(pathname);
  if (ref !== null && isReferralEnabled() && !isPaymentReturn) {
    const code = ref.trim().toUpperCase();
    const domain = domainSlug(request.nextUrl.searchParams.get("domain"));
    const url = request.nextUrl.clone();
    url.pathname = "/fr/recommandation";
    url.search = `?domaine=${domain}`;
    const response = NextResponse.redirect(url);
    if (REFERRAL_CODE_PATTERN.test(code) && !request.cookies.get(REFERRAL_COOKIE)) {
      response.cookies.set(REFERRAL_COOKIE, `${code}:${domain}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: "/",
      });
    }
    return response;
  }

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

  // MonEmploiGo Pro : introuvable (vraie 404) tant qu'il n'est pas activé,
  // et en français uniquement (/en/pro/… → /fr/pro/…). Voir src/lib/pro/flag.ts.
  if (REFERRAL_SEGMENTS.includes(segment)) {
    if (!isReferralEnabled()) return NextResponse.rewrite(new URL(`/${locale}/404`, request.url));
    if (locale !== "fr") {
      const url = request.nextUrl.clone();
      url.pathname = `/fr/${rest.join("/")}`;
      return NextResponse.redirect(url);
    }
  }

  if (segment === "pro") {
    if (!isProEnabled()) return NextResponse.rewrite(new URL(`/${locale}/404`, request.url));
    if (locale !== "fr") {
      const url = request.nextUrl.clone();
      url.pathname = `/fr/${rest.join("/")}`;
      return NextResponse.redirect(url);
    }
    if (PRO_PRIVATE_SEGMENTS.includes(rest[1]) && !session?.userId) {
      return NextResponse.redirect(new URL("/fr/pro/connexion", request.url));
    }
    const response = NextResponse.next();
    if (!PRO_INDEXABLE_SEGMENTS.includes(rest[1])) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
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
