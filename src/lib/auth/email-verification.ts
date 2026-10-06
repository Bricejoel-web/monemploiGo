import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";

// Preuve qu'une personne possède réellement l'adresse e-mail de son compte
// (exigée pour l'accès administrateur, voir src/lib/referral/admin.ts).
// Même construction que les liens « mot de passe oublié » : jeton de 32
// octets envoyé par e-mail, seule son empreinte SHA-256 en base, 1 heure,
// usage unique. En plus, le lien ne vaut que pour le compte connecté :
// un lien intercepté ou ouvert par un logiciel d'analyse de messagerie
// (sans session) ne vérifie rien.

const TOKEN_TTL_MS = 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Nouveau lien ; les liens précédents encore valables sont annulés. */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    prisma.emailVerificationToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + TOKEN_TTL_MS) } }),
  ]);
  return token;
}

/** Vrai si le lien est valable pour CE compte : l'adresse est alors vérifiée. */
export async function consumeEmailVerificationToken(token: string, userId: string): Promise<boolean> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.emailVerificationToken.updateMany({
      where: { tokenHash: hashToken(token), userId, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count === 0) return false;
    await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: now } });
    return true;
  });
}
