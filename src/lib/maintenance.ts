import { NextResponse, type NextRequest } from "next/server";

/**
 * Mode maintenance (panne grave, piratage, maintenance) : MAINTENANCE_MODE=true
 * dans Vercel, puis redéploiement. Tout le site répond alors par une page
 * autonome (HTTP 503) : aucune base de données, aucune feuille de style,
 * aucune dépendance — elle fonctionne même si tout le reste est en panne.
 * Pages, actions (connexion, paiement, retrait…), API, webhooks et tâche
 * quotidienne sont bloqués ; les paiements en attente seront confirmés au
 * redémarrage (vérification à l'affichage et tâche quotidienne).
 *
 * Accès réservé : ouvrir n'importe quelle page avec
 * ?acces-maintenance=<MAINTENANCE_BYPASS> pose un cookie (empreinte SHA-256
 * du secret, jamais le secret) qui laisse passer ce navigateur seulement.
 * Sans MAINTENANCE_BYPASS défini, personne n'a d'accès réservé.
 */
export const MAINTENANCE_COOKIE = "monemploigo_maintenance";
const BYPASS_PARAM = "acces-maintenance";

export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparaison en temps constant de deux empreintes hexadécimales. */
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const TEXT = {
  fr: {
    title: "Site en maintenance",
    body: "monemploiGo est momentanément indisponible, le temps d'une intervention technique. Vos comptes, vos documents et vos paiements sont conservés. Merci de revenir un peu plus tard.",
    contact: "Une question urgente ?",
  },
  en: {
    title: "Site under maintenance",
    body: "monemploiGo is temporarily unavailable during technical work. Your accounts, documents and payments are safe. Please come back a little later.",
    contact: "Urgent question?",
  },
} as const;

function maintenancePage(locale: "fr" | "en"): string {
  const t = TEXT[locale];
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${t.title} — monemploiGo</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#efe6d8;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;">
<main style="max-width:460px;width:100%;background:#fbfaf8;border:1px solid rgba(0,0,0,.1);border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.08);">
<p style="margin:0 0 16px;font-size:22px;font-weight:bold;"><span style="color:#16324f;">monemploi</span><span style="color:#eb5757;">Go</span></p>
<svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#eb5757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/></svg>
<h1 style="font-size:20px;margin:12px 0 8px;">${t.title}</h1>
<p style="font-size:15px;line-height:1.55;color:#4a453f;margin:0 0 18px;">${t.body}</p>
<p style="font-size:13px;color:#5f5a52;margin:0;">${t.contact} <a href="mailto:monemploigo.contact@gmail.com" style="color:#c94f30;font-weight:bold;">monemploigo.contact@gmail.com</a></p>
</main>
</body>
</html>`;
}

/**
 * Réponse de maintenance, ou null si la requête peut passer (mode éteint,
 * ou navigateur muni de l'accès réservé).
 */
export async function maintenanceResponse(request: NextRequest): Promise<NextResponse | null> {
  if (!isMaintenanceMode()) return null;
  const secret = process.env.MAINTENANCE_BYPASS;
  const { pathname, searchParams } = request.nextUrl;

  if (secret) {
    const expected = await sha256(secret);
    const offered = searchParams.get(BYPASS_PARAM);
    if (offered && sameHash(await sha256(offered), expected)) {
      // Accès accordé : cookie posé, puis la même page sans le secret dans l'adresse.
      const url = request.nextUrl.clone();
      url.searchParams.delete(BYPASS_PARAM);
      const response = NextResponse.redirect(url);
      response.cookies.set(MAINTENANCE_COOKIE, expected, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 12 * 60 * 60 });
      return response;
    }
    const cookie = request.cookies.get(MAINTENANCE_COOKIE)?.value;
    if (cookie && sameHash(cookie, expected)) return null;
  }

  const headers = { "Retry-After": "3600", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (pathname.startsWith("/api/") || request.method !== "GET") {
    return NextResponse.json({ error: "maintenance" }, { status: 503, headers });
  }
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  return new NextResponse(maintenancePage(locale), { status: 503, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}
