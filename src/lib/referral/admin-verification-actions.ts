"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendEmailVerificationEmail } from "@/lib/email/email-verification-email";
import { rateLimit } from "@/lib/security/rate-limit";
import { isAdminEmail } from "./admin";
import { isReferralEnabled } from "./config";

/**
 * Envoie le lien de vérification à l'adresse du compte connecté, seulement
 * si c'est une adresse administrateur (aucun envoi pour les autres comptes).
 */
export async function sendAdminVerificationEmail() {
  if (!isReferralEnabled()) redirect("/fr");
  const user = await getCurrentUser();
  if (!user) redirect("/fr/connexion");
  if (!isAdminEmail(user.email) || user.emailVerifiedAt) redirect("/fr/admin/retraits");
  if (!(await rateLimit(`admin-verify:${user.id}`, 3, 60 * 60 * 1000)).allowed) {
    redirect("/fr/admin/verification?erreur=limite");
  }
  const token = await createEmailVerificationToken(user.id);
  const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/fr/admin/verification?jeton=${token}`;
  const sent = await sendEmailVerificationEmail({ to: user.email, url });
  redirect(`/fr/admin/verification?${sent ? "envoye=1" : "erreur=envoi"}`);
}
