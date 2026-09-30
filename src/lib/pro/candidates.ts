import "server-only";
import { prisma } from "@/lib/db/client";

export type CandidateFilter = "tous" | "actifs" | "archives";

/**
 * Candidats du compte Pro, avec recherche (chaque mot doit apparaître dans
 * le prénom, le nom, l'e-mail, le pays ou le domaine) et filtre de statut.
 * Toujours limité au compte donné : jamais les candidats d'un autre compte.
 */
export function listCandidates(professionalAccountId: string, { query, filter }: { query: string; filter: CandidateFilter }) {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return prisma.professionalCandidate.findMany({
    where: {
      professionalAccountId,
      ...(filter === "actifs" ? { status: "ACTIVE" as const } : filter === "archives" ? { status: "ARCHIVED" as const } : {}),
      AND: words.map((word) => ({
        OR: (["firstName", "lastName", "email", "destinationCountry", "professionalField"] as const).map((field) => ({
          [field]: { contains: word, mode: "insensitive" as const },
        })),
      })),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { _count: { select: { documents: true } } },
  });
}

/** Un candidat, seulement s'il appartient à ce compte Pro (sinon null). */
export function getOwnedCandidate(professionalAccountId: string, candidateId: string) {
  return prisma.professionalCandidate.findFirst({
    where: { id: candidateId, professionalAccountId },
    include: { _count: { select: { documents: true } } },
  });
}
