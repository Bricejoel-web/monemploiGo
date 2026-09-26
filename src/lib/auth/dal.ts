import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "@/lib/db/client";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
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
