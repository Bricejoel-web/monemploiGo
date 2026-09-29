import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/dal";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { loadOwnedPaidDocument } from "@/lib/documents/load-document";
import { renderPageToPdf } from "@/lib/pdf/render-pdf";
import { rateLimit } from "@/lib/security/rate-limit";
import { isLocale } from "@/i18n/config";

// Téléchargement du PDF d'un document payé : fabriqué par un Chrome sans
// écran à partir de la page d'aperçu (voir src/lib/pdf/render-pdf.ts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Démarrage de Chromium (quelques secondes à froid) + rendu de la page.
export const maxDuration = 60;

const FILE_PREFIX = { CV: "CV", COVER_LETTER: "Lettre-de-motivation", BEWERBUNGSBRIEF: "Bewerbungsbrief" } as const;

function asciiSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/documents/[id]/pdf">) {
  const { id } = await ctx.params;
  const langParam = request.nextUrl.searchParams.get("lang") ?? "";
  const locale = isLocale(langParam) ? langParam : "fr";
  const previewPage = new URL(`/${locale}/document/${id}/apercu`, request.nextUrl.origin);
  const backWithError = (reason?: string) => {
    const url = new URL(previewPage);
    url.searchParams.set("pdf", "erreur");
    // Diagnostic sur les prévisualisations seulement (jamais en production).
    if (reason && process.env.VERCEL_ENV === "preview") url.searchParams.set("raison", reason.slice(0, 300));
    return NextResponse.redirect(url, 303);
  };

  const session = await verifySession();
  if (!session) return NextResponse.redirect(new URL(`/${locale}/connexion`, request.nextUrl.origin), 303);

  // Document payé, encore disponible, appartenant au client connecté —
  // sinon la page d'aperçu explique la situation (brouillon, expiré…).
  const loaded = await loadOwnedPaidDocument(id, session.userId);
  if (!loaded) return NextResponse.redirect(previewPage, 303);

  if (!rateLimit(`pdf:${session.userId}`, 15, 15 * 60 * 1000).allowed) return backWithError();

  const renderUrl = new URL(previewPage);
  renderUrl.searchParams.set("rendu", "pdf");
  const cookies = [SESSION_COOKIE, "_vercel_jwt"]
    .map((name) => ({ name, value: request.cookies.get(name)?.value ?? "" }))
    .filter((c) => c.value);

  let pdf: Uint8Array;
  try {
    pdf = await renderPageToPdf(renderUrl.toString(), cookies);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[pdf] échec du rendu", id, reason);
    return backWithError(reason);
  }

  const name = asciiSlug(loaded.data.fullName || "") || "monemploiGo";
  const filename = `${FILE_PREFIX[loaded.kind]}-${name}.pdf`;
  const response = new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
  // Signal pour la page (voir DocumentDownload) : le fichier est parti,
  // on peut retirer l'indicateur « Préparation… ».
  const token = request.nextUrl.searchParams.get("t");
  if (token && /^[a-z0-9]{6,20}$/i.test(token)) {
    response.cookies.set("pdf_pret", token, { path: "/", maxAge: 120, sameSite: "lax" });
  }
  return response;
}
