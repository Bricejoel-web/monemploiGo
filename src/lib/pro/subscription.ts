import "server-only";
import { prisma } from "@/lib/db/client";
import { DAY_MS, PRO_STARTER, READ_ONLY_DAYS } from "./plans";

type Period = { id: string; startsAt: Date; expiresAt: Date; documentsUsed: number };

/**
 * Accès Pro, toujours déduit des périodes payées (jamais d'un statut stocké
 * ou envoyé par le navigateur) :
 *  - none : jamais abonné ;
 *  - active : une période couvre maintenant ; `accessUntil` inclut les
 *    renouvellements anticipés accolés à la suite ;
 *  - readonly : expiré depuis moins de 90 jours (consultation seulement) ;
 *  - lapsed : expiré depuis plus de 90 jours.
 */
export type ProAccess =
  | { state: "none" }
  | { state: "active"; period: Period; accessUntil: Date }
  | { state: "readonly"; expiredAt: Date; deletionAt: Date }
  | { state: "lapsed"; expiredAt: Date };

export function computeAccess(periods: Period[], now = new Date()): ProAccess {
  if (periods.length === 0) return { state: "none" };
  const sorted = [...periods].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const current = sorted.find((p) => p.startsAt <= now && now < p.expiresAt);
  if (current) {
    let accessUntil = current.expiresAt;
    for (const p of sorted) {
      if (p.startsAt <= accessUntil && p.expiresAt > accessUntil) accessUntil = p.expiresAt;
    }
    return { state: "active", period: current, accessUntil };
  }

  const expiredAt = new Date(Math.max(...sorted.map((p) => p.expiresAt.getTime())));
  const deletionAt = new Date(expiredAt.getTime() + READ_ONLY_DAYS * DAY_MS);
  return now < deletionAt ? { state: "readonly", expiredAt, deletionAt } : { state: "lapsed", expiredAt };
}

export async function getProAccess(professionalAccountId: string): Promise<ProAccess> {
  const periods = await prisma.subscription.findMany({
    where: { professionalAccountId },
    select: { id: true, startsAt: true, expiresAt: true, documentsUsed: true },
  });
  return computeAccess(periods);
}

/** Chiffres du tableau de bord, tous lus en base pour CE compte Pro. */
export async function getProOverview(professionalAccountId: string) {
  const [access, activeCandidates] = await Promise.all([
    getProAccess(professionalAccountId),
    prisma.professionalCandidate.count({ where: { professionalAccountId, status: "ACTIVE" } }),
  ]);
  const documentsUsed = access.state === "active" ? access.period.documentsUsed : null;
  return {
    access,
    activeCandidates,
    maxActiveCandidates: PRO_STARTER.maxActiveCandidates,
    /** Nul hors période active : il n'y a alors aucune période en cours. */
    documentsUsed,
    maxDocuments: PRO_STARTER.maxDocumentsPerPeriod,
    documentsAvailable: documentsUsed === null ? 0 : Math.max(0, PRO_STARTER.maxDocumentsPerPeriod - documentsUsed),
  };
}

export type ProOverview = Awaited<ReturnType<typeof getProOverview>>;
