import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "./password";

/** Durée de validité d'un lien de réinitialisation. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Crée un lien de réinitialisation pour ce compte et renvoie le jeton en
 * clair (il n'est stocké nulle part : seule son empreinte est en base). Les
 * liens précédents encore valables sont annulés : seul le dernier e-mail
 * reçu fonctionne.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS) },
    }),
  ]);
  return token;
}

/** Vrai si le lien existe, n'a pas servi et n'a pas expiré (affichage du formulaire). */
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const found = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { usedAt: true, expiresAt: true },
  });
  return Boolean(found && !found.usedAt && found.expiresAt > new Date());
}

/**
 * Change le mot de passe si le lien est valable. Utilisation unique, même en
 * cas de double envoi simultané du formulaire : seule la requête qui marque
 * le lien comme utilisé change le mot de passe.
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(newPassword);
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const found = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
    if (!found) return false;
    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: found.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count === 0) return false;
    // Nouvelle version de session : les sessions déjà ouvertes (autres
    // appareils, éventuel intrus) sont fermées.
    await tx.user.update({ where: { id: found.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    // Tout autre lien encore valable pour ce compte devient inutilisable.
    await tx.passwordResetToken.updateMany({ where: { userId: found.userId, usedAt: null }, data: { usedAt: now } });
    return true;
  });
}
