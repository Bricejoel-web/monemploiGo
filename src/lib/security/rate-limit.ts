import "server-only";

/**
 * Limiteur de débit en mémoire, pour freiner le bruteforce sur les
 * formulaires sensibles (connexion, inscription, paiement). Suffisant pour
 * un déploiement mono-instance ; à remplacer par un store partagé (Redis)
 * si le site tourne un jour sur plusieurs instances.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count };
}
