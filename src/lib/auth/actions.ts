"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { clientKey } from "@/lib/security/client-key";
import { passwordSchema } from "./password-rules";
import { prisma } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";
import { verifySession } from "./dal";
import { rateLimit } from "@/lib/security/rate-limit";
import { TERMS_VERSION } from "@/data/legal/legal-config";
import { after } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sendWelcomeEmail } from "@/lib/email/welcome-email";
import { clearReferralCookie, referralForNewAccount } from "@/lib/referral/attribution";

export type AuthFormState =
  | {
      errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        terms?: string[];
      };
      message?: string;
    }
  | undefined;

// La confirmation du mot de passe et la case des conditions sont déjà
// vérifiées côté client (voir SignupForm.tsx), mais une Server Action ne
// doit jamais faire confiance à une validation uniquement côté client —
// tout est donc revérifié ici. Règle de mot de passe renforcée (majuscule +
// minuscule + chiffre + caractère spécial, pas seulement "une lettre") à la
// demande explicite de l'utilisateur, affichée en direct sous forme de
// checklist dans le formulaire.
const SignupSchema = z
  .object({
    firstName: z.string().trim().min(2, { error: "Le prénom doit contenir au moins 2 caractères." }),
    lastName: z.string().trim().min(2, { error: "Le nom doit contenir au moins 2 caractères." }),
    email: z.email({ error: "Adresse e-mail invalide." }).trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.literal("on", { error: "Merci d'accepter les conditions d'utilisation et la politique de confidentialité." }),
    // Une case à cocher non cochée est absente de FormData : `.get()` renvoie
    // alors `null` (pas `undefined`), d'où `.nullish()` plutôt que
    // `.optional()` seul, qui n'accepterait pas `null`.
    marketingConsent: z.string().nullish(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

const LoginSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).trim(),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export async function signup(locale: string, _state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const key = await clientKey("signup");
  if (!rateLimit(key, 5, 15 * 60 * 1000).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const validated = SignupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
    marketingConsent: formData.get("marketingConsent"),
  });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { firstName, lastName, email, password, marketingConsent } = validated.data;
  const name = `${firstName} ${lastName}`.trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Un compte existe déjà avec cet e-mail."] } };
  }

  const passwordHash = await hashPassword(password);
  // Parrainage : parrain vérifié côté serveur, fixé une fois pour toutes.
  const referral = await referralForNewAccount(email);
  const user = await prisma.user.create({
    data: {
      ...referral,
      name,
      email,
      passwordHash,
      marketingConsent: marketingConsent === "on",
      // La case CGU est obligatoire (voir SignupSchema ci-dessus) : on
      // enregistre donc systématiquement la version acceptée, pour savoir
      // quelle version un utilisateur donné a acceptée si les CGU évoluent.
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
    },
    select: { id: true },
  });

  await clearReferralCookie();
  await createSession(user.id);
  // Envoyé après la réponse : l'inscription n'attend jamais le serveur de
  // messagerie, et un échec d'envoi ne la fait jamais échouer.
  after(() =>
    sendWelcomeEmail({ to: email, firstName, locale: isLocale(locale) ? locale : defaultLocale }),
  );
  redirect(`/${locale}/tableau-de-bord`);
}

export async function login(locale: string, _state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const key = await clientKey("login");
  if (!rateLimit(key, 8, 15 * 60 * 1000).allowed) {
    return { message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { email, password } = validated.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Message volontairement identique dans les deux cas pour ne pas révéler
  // si l'e-mail existe (limite les attaques d'énumération de comptes).
  const genericError = { message: "E-mail ou mot de passe incorrect." };
  if (!user) return genericError;

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return genericError;

  await createSession(user.id, user.sessionVersion);
  redirect(`/${locale}/tableau-de-bord`);
}

export async function logout(locale: string) {
  await deleteSession();
  redirect(`/${locale}`);
}

/**
 * Suppression du compte. Refusée tant qu'une demande de retrait de
 * parrainage est en attente (vérifié sous verrou du compte : une demande
 * ne peut pas se glisser entre la vérification et la suppression). Les
 * traces financières du parrainage (commissions, retraits traités, journal)
 * sont conservées, détachées du compte (voir schema.prisma).
 */
export async function deleteAccount(locale: string): Promise<{ error?: string } | undefined> {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  const deleted = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.userId} FOR UPDATE`;
      const pending = await tx.withdrawalRequest.count({ where: { userId: session.userId, status: "PENDING" } });
      if (pending > 0) return false;
      await tx.user.delete({ where: { id: session.userId } });
      return true;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  if (!deleted) {
    const dict = await getDictionary(isLocale(locale) ? locale : defaultLocale);
    return { error: dict.dashboard.deleteBlockedPendingWithdrawal };
  }
  await deleteSession();
  redirect(`/${locale}`);
}
