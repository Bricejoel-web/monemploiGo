import "server-only";
import { headers } from "next/headers";

/** Clé de limitation de débit par adresse IP (voir rate-limit.ts). */
export async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}`;
}
