import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { isReferralEnabled } from "./config";

/** Administrateurs : adresses e-mail de la variable ADMIN_EMAILS (séparées par des virgules). */
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

/**
 * Accès administrateur, vérifié côté serveur à CHAQUE page et action. Un
 * compte non administrateur obtient une page introuvable (l'existence de
 * l'administration n'est pas révélée).
 *
 * L'adresse doit en plus avoir été PROUVÉE (lien reçu par e-mail et ouvert,
 * voir src/lib/auth/email-verification.ts) : le site ne vérifie pas les
 * adresses à l'inscription, et sans cette preuve quiconque s'inscrirait le
 * premier avec l'adresse d'un administrateur obtiendrait ses droits.
 */
export async function requireAdmin() {
  if (!isReferralEnabled()) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/fr/connexion");
  if (!isAdminEmail(user.email)) notFound();
  if (!user.emailVerifiedAt) redirect("/fr/admin/verification");
  return user;
}
