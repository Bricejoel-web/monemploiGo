"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";
import { verifySession } from "./dal";
import { rateLimit } from "@/lib/security/rate-limit";
import { TERMS_VERSION } from "@/data/legal/legal-config";

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
    password: z
      .string()
      .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
      .regex(/[A-Z]/, { error: "Doit contenir au moins une lettre majuscule." })
      .regex(/[a-z]/, { error: "Doit contenir au moins une lettre minuscule." })
      .regex(/[0-9]/, { error: "Doit contenir au moins un chiffre." })
      .regex(/[^A-Za-z0-9]/, { error: "Doit contenir au moins un caractère spécial." }),
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

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}`;
}

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
  const user = await prisma.user.create({
    data: {
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

  await createSession(user.id);
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

  await createSession(user.id);
  redirect(`/${locale}/tableau-de-bord`);
}

export async function logout(locale: string) {
  await deleteSession();
  redirect(`/${locale}`);
}

export async function deleteAccount(locale: string) {
  const session = await verifySession();
  if (!session) redirect(`/${locale}/connexion`);

  await prisma.user.delete({ where: { id: session.userId } });
  await deleteSession();
  redirect(`/${locale}`);
}
