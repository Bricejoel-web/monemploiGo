import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { verifySession } from "@/lib/auth/dal";
import { isProEnabled } from "./flag";

/**
 * Accès aux données Pro. Règle de sécurité de tout l'espace Pro : le compte
 * Pro est TOUJOURS déduit de la session côté serveur, jamais d'un identifiant
 * envoyé par le navigateur. Toute requête sur une donnée Pro filtre ensuite
 * par `professionalAccountId` de ce compte.
 */
export const getCurrentProAccount = cache(async () => {
  const session = await verifySession();
  if (!session) return null;
  return prisma.professionalAccount.findUnique({ where: { userId: session.userId } });
});

/**
 * Pour les pages privées de l'espace Pro : sans session → connexion Pro ;
 * session sans espace Pro → création de l'espace ; espace suspendu →
 * connexion Pro avec un message. Pro désactivé → introuvable.
 */
export const requireProAccount = cache(async () => {
  if (!isProEnabled()) notFound();
  const session = await verifySession();
  if (!session) redirect("/fr/pro/connexion");
  const account = await prisma.professionalAccount.findUnique({ where: { userId: session.userId } });
  if (!account) redirect("/fr/pro/inscription");
  if (account.status === "SUSPENDED") redirect("/fr/pro/connexion?suspendu=1");
  return account;
});
