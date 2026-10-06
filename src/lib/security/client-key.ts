import "server-only";
import { headers } from "next/headers";

/**
 * Clé de limitation de débit par adresse IP (voir rate-limit.ts). Sur
 * Vercel, `x-real-ip` est l'adresse réelle du visiteur, fixée par la
 * plateforme (un visiteur ne peut pas la falsifier en envoyant lui-même
 * l'en-tête) ; `x-forwarded-for` sert seulement de repli hors Vercel.
 */
export async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${prefix}:${ip}`;
}
