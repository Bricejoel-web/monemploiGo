import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { SESSION_COOKIE, decryptSessionToken } from "@/lib/auth/session";

const LOCALE_COOKIE = "NEXT_LOCALE";
const PROTECTED_SEGMENTS = ["tableau-de-bord"];
const AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS = ["connexion", "inscription"];

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

  if (PROTECTED_SEGMENTS.includes(segment) && !session?.userId) {
    return NextResponse.redirect(new URL(`/${locale}/connexion`, request.url));
  }

  if (AUTH_ONLY_WHEN_LOGGED_OUT_SEGMENTS.includes(segment) && session?.userId) {
    return NextResponse.redirect(new URL(`/${locale}/tableau-de-bord`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
