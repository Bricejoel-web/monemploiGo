"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { verifySession } from "@/lib/auth/dal";
import { createSession, deleteSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { passwordSchema } from "@/lib/auth/password-rules";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientKey } from "@/lib/security/client-key";
import { PRO_TERMS_VERSION, TERMS_VERSION } from "@/data/legal/legal-config";
import { isProEnabled } from "./flag";
import { structureFields } from "./space-fields";

// Espace MonEmploiGo Pro : même système de connexion que les particuliers
// (même `User`, même cookie de session, mêmes mots de passe hachés), aucune
// seconde authentification. Tout est revérifié ici, jamais seulement dans le
// formulaire.

export type ProFormState =
  | {
      errors?: Partial<Record<"companyName" | "managerName" | "email" | "phone" | "password" | "confirmPassword" | "terms", string[]>>;
      message?: string;
      /** L'e-mail appartient déjà à un compte MonEmploiGo : proposer de se connecter. */
      existingAccount?: boolean;
    }
  | undefined;

const DISABLED: ProFormState = { message: "MonEmploiGo Pro n'est pas encore disponible." };

const spaceFields = {
  ...structureFields,
  terms: z.literal("on", {
    error: "Merci d'accepter les Conditions générales d'utilisation et les Conditions d'utilisation de MonEmploiGo Pro.",
  }),
};

const CreateSpaceSchema = z.object(spaceFields);

const SignupSchema = z
  .object({ ...spaceFields, password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

function readSpaceFields(formData: FormData) {
  return {
    companyName: formData.get("companyName"),
    managerName: formData.get("managerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    terms: formData.get("terms"),
  };
}

/** Données de l'espace Pro, avec les versions des deux textes acceptés. */
function accountData(data: z.infer<typeof CreateSpaceSchema>) {
  return {
    companyName: data.companyName,
    managerName: data.managerName,
    email: data.email,
    phone: data.phone,
    termsVersion: TERMS_VERSION,
    proTermsVersion: PRO_TERMS_VERSION,
    termsAcceptedAt: new Date(),
  };
}

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const emailTaken = (email: string) =>
  prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });

/** Nouveau compte MonEmploiGo + espace Pro, en une seule opération. */
export async function signupPro(_state: ProFormState, formData: FormData): Promise<ProFormState> {
  if (!isProEnabled()) return DISABLED;
  if (!(await rateLimit(await clientKey("pro-signup"), 5, 15 * 60 * 1000)).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const validated = SignupSchema.safeParse({
    ...readSpaceFields(formData),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };
  const data = validated.data;

  // Jamais de doublon, même si l'adresse diffère seulement par les
  // majuscules : on propose de se connecter au compte existant.
  const existing: ProFormState = {
    existingAccount: true,
    errors: { email: ["Un compte MonEmploiGo existe déjà avec cette adresse e-mail."] },
  };
  if (await emailTaken(data.email)) return existing;

  let userId: string;
  try {
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        name: data.managerName,
        // En minuscules, comme l'inscription des particuliers.
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: now,
        professionalAccount: { create: accountData(data) },
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueViolation(error)) return existing;
    throw error;
  }

  await createSession(userId);
  redirect("/fr/pro/dashboard");
}

/** Création de l'espace Pro pour le compte déjà connecté. */
export async function createProSpace(_state: ProFormState, formData: FormData): Promise<ProFormState> {
  if (!isProEnabled()) return DISABLED;
  const session = await verifySession();
  if (!session) redirect("/fr/pro/connexion");

  if (!(await rateLimit(`pro-space:${session.userId}`, 10, 15 * 60 * 1000)).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const validated = CreateSpaceSchema.safeParse(readSpaceFields(formData));
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  try {
    await prisma.professionalAccount.create({ data: { userId: session.userId, ...accountData(validated.data) } });
  } catch (error) {
    // Espace déjà créé (double clic, autre onglet) : on y va simplement.
    if (!isUniqueViolation(error)) throw error;
  }
  redirect("/fr/pro/dashboard");
}

const LoginSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).trim(),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export async function loginPro(_state: ProFormState, formData: FormData): Promise<ProFormState> {
  if (!isProEnabled()) return DISABLED;
  if (!(await rateLimit(await clientKey("login"), 8, 15 * 60 * 1000)).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const validated = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  // Seconde limite, par compte (voir login dans src/lib/auth/actions.ts).
  if (!(await rateLimit(`login-account:${validated.data.email.toLowerCase()}`, 20, 60 * 60 * 1000)).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }
  const user = await prisma.user.findFirst({
    where: { email: { equals: validated.data.email, mode: "insensitive" } },
    select: { id: true, passwordHash: true, sessionVersion: true, professionalAccount: { select: { id: true } } },
  });
  // Même message dans les deux cas : ne révèle pas si l'adresse est inscrite.
  const genericError = { message: "E-mail ou mot de passe incorrect." };
  if (!user) return genericError;
  if (!(await verifyPassword(validated.data.password, user.passwordHash))) return genericError;

  await createSession(user.id, user.sessionVersion);
  // Compte sans espace Pro (particulier) : proposer de le créer.
  redirect(user.professionalAccount ? "/fr/pro/dashboard" : "/fr/pro/inscription");
}

export async function logoutPro() {
  await deleteSession();
  redirect("/fr/pro/connexion");
}
