import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Solde de parrainage, toujours CALCULÉ à partir des écritures (jamais
 * stocké, jamais envoyé par le navigateur) :
 *  - total gagné = commissions valides (un retrait ne le diminue pas) ;
 *  - en attente = retraits demandés, pas encore traités (montant réservé) ;
 *  - disponible = total gagné − retraits payés − retraits en attente.
 * Un retrait refusé ne compte plus : son montant redevient disponible.
 */
export async function getReferralBalance(userId: string, db: Db = prisma) {
  // Requêtes l'une après l'autre : ce calcul tourne aussi dans une
  // transaction (demande de retrait), où les requêtes parallèles sont à éviter.
  const earned = await db.referralCommission.aggregate({ where: { referrerId: userId, status: "VALID" }, _sum: { amountFcfa: true } });
  const paid = await db.withdrawalRequest.aggregate({ where: { userId, status: "PAID" }, _sum: { amountFcfa: true } });
  const pending = await db.withdrawalRequest.aggregate({ where: { userId, status: "PENDING" }, _sum: { amountFcfa: true } });
  const totalEarned = earned._sum.amountFcfa ?? 0;
  const paidOut = paid._sum.amountFcfa ?? 0;
  const reserved = pending._sum.amountFcfa ?? 0;
  // Peut devenir négatif si une commission déjà retirée est annulée
  // (remboursement) : affiché à 0, et aucun retrait possible d'ici là.
  return { totalEarned, paidOut, pending: reserved, available: Math.max(0, totalEarned - paidOut - reserved), rawAvailable: totalEarned - paidOut - reserved };
}

/** Identifiant anonyme et stable d'une personne recommandée (« Utilisateur recommandé #2841 »). */
export function anonymousNumber(userId: string | null): string {
  if (!userId) return "—";
  return String(parseInt(createHash("sha256").update(userId).digest("hex").slice(0, 8), 16) % 9000 + 1000);
}

/**
 * Code de parrainage personnel, créé à la première visite de la page
 * (ex. BRICE82) puis toujours le même. Lettres du prénom (A-Z, 6 au plus)
 * + 2 à 4 chiffres ; nouvel essai en cas de code déjà pris.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true, name: true, email: true } });
  if (user.referralCode) return user.referralCode;

  // Le prénom (premier mot du nom), à défaut le début de l'e-mail.
  const letters =
    (user.name?.trim().split(/\s+/)[0] || user.email.split("@")[0])
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6) || "MEG";
  for (let attempt = 0; attempt < 8; attempt++) {
    const digits = attempt < 4 ? 2 : 4;
    const code = `${letters.padEnd(2, "X")}${Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1))}`;
    const { count } = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } }).catch(() => ({ count: 0 }));
    if (count === 1) return code;
    // Déjà attribué entre-temps (autre onglet) : on relit.
    const again = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (again?.referralCode) return again.referralCode;
  }
  throw new Error("Impossible de créer un code de parrainage.");
}
