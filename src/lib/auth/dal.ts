import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "@/lib/db/client";

/**
 * Session valable : cookie signé ET compte existant dont la version de
 * session est celle du cookie. Une réinitialisation du mot de passe
 * incrémente cette version et ferme donc les sessions des autres appareils ;
 * un compte supprimé n'a plus de session. Une requête par page (mise en
 * cache pour toute la requête). Le proxy, lui, ne fait qu'une vérification
 * optimiste du cookie : toute donnée protégée passe par ici.
 */
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { sessionVersion: true } });
  if (!user || (session.v ?? 0) !== user.sessionVersion) return null;
  return { isAuth: true as const, userId: session.userId };
});

export const requireSession = cache(async (locale: string) => {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return user;
});
