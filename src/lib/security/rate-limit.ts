import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";

/**
 * Limiteur de débit des formulaires sensibles (connexion, inscription,
 * paiement…). Les compteurs sont en base (table RateLimitBucket) : partagés
 * par toutes les instances du site sur Vercel, contrairement à l'ancien
 * compteur en mémoire, que chaque instance tenait seule (une attaque
 * répartie sur plusieurs instances le contournait).
 *
 * Une seule requête atomique (INSERT … ON CONFLICT) : deux tentatives
 * simultanées ne peuvent pas lire le même compteur. La clé est hachée
 * (SHA-256) : ni adresse IP ni e-mail en clair dans la base.
 *
 * Base indisponible : la tentative est laissée passer et l'incident est
 * journalisé — l'action protégée échoue de toute façon sans base.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  const hashed = createHash("sha256").update(key).digest("hex");
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt") VALUES (${hashed}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" < ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimitBucket"."resetAt" END
      RETURNING "count"`;
    const count = Number(rows[0]?.count ?? 1);
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } catch (error) {
    console.error("[rate-limit] compteur indisponible", error instanceof Error ? error.message : error);
    return { allowed: true, remaining: 0 };
  }
}

/** Supprime les compteurs expirés depuis plus d'un jour (tâche quotidienne). */
export async function purgeExpiredRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  return count;
}
