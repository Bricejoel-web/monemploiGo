import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { purgeExpiredDocuments } from "@/lib/documents/retention";

/**
 * Purge quotidienne des documents arrivés à échéance (voir retention.ts),
 * déclenchée par le cron Vercel déclaré dans vercel.json.
 *
 * Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` quand
 * la variable CRON_SECRET est définie sur le projet. Sans ce secret, la
 * route refuse de tourner : une URL publique ne doit jamais pouvoir
 * déclencher des suppressions.
 *
 * La purge ne fait que rattraper physiquement ce qui est déjà inaccessible :
 * l'échéance est aussi appliquée à la lecture (load-document.ts, tableau de
 * bord). Un cron manqué ne rend donc jamais un document expiré accessible.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await purgeExpiredDocuments();
  console.info("[cron] purge-documents", result);
  return NextResponse.json({ ok: true, ...result });
}
