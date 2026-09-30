"use server";

import { z } from "zod";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientKey } from "@/lib/security/client-key";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { sendPasswordResetEmail } from "@/lib/email/password-reset-email";
import { createPasswordResetToken, resetPasswordWithToken } from "./password-reset";
import { passwordSchema } from "./password-rules";

export type PasswordResetFormState =
  | { sent?: boolean; message?: string; errors?: { email?: string[]; password?: string[]; confirmPassword?: string[] } }
  | undefined;

/** Espace d'où vient la demande : décide de la page de connexion de retour. */
type Space = "particulier" | "pro";

function loginPath(locale: Locale, space: Space) {
  return space === "pro" ? "/fr/pro/connexion" : `/${locale}/connexion`;
}

/**
 * Demande de lien. La réponse est TOUJOURS la même, que le compte existe ou
 * non : elle ne permet pas de savoir si une adresse est inscrite. L'e-mail
 * part après la réponse (`after`), pour ne pas trahir l'existence du compte
 * par un temps de réponse plus long.
 */
export async function requestPasswordReset(
  rawLocale: string,
  space: Space,
  _state: PasswordResetFormState,
  formData: FormData,
): Promise<PasswordResetFormState> {
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = (await getDictionary(locale)).passwordReset;

  if (!rateLimit(await clientKey("pwreset"), 5, 15 * 60 * 1000).allowed) {
    return { message: t.tooMany };
  }

  const parsed = z.email().trim().safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: [t.invalidEmail] } };
  const email = parsed.data;

  // Au plus 3 liens par adresse et par heure, sans le signaler (même réponse).
  if (rateLimit(`pwreset-email:${email.toLowerCase()}`, 3, 60 * 60 * 1000).allowed) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true },
    });
    if (user) {
      const token = await createPasswordResetToken(user.id);
      const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
      const query = new URLSearchParams({ token, ...(space === "pro" ? { espace: "pro" } : {}) });
      const resetUrl = `${baseUrl}/${space === "pro" ? "fr" : locale}/reinitialiser-mot-de-passe?${query}`;
      after(() => sendPasswordResetEmail({ to: user.email, resetUrl, locale: space === "pro" ? "fr" : locale }));
    }
  }

  return { sent: true };
}

const ResetSchema = z
  .object({ token: z.string().min(20), password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  rawLocale: string,
  space: Space,
  _state: PasswordResetFormState,
  formData: FormData,
): Promise<PasswordResetFormState> {
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = (await getDictionary(locale)).passwordReset;

  if (!rateLimit(await clientKey("pwreset-submit"), 10, 15 * 60 * 1000).allowed) {
    return { message: t.tooMany };
  }

  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { password, confirmPassword } = z.flattenError(parsed.error).fieldErrors;
    if (!password && !confirmPassword) return { message: t.invalidLink };
    return { errors: { password, confirmPassword } };
  }

  const done = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!done) return { message: t.invalidLink };

  redirect(`${loginPath(locale, space)}?reinitialise=1`);
}
