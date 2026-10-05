import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { verifySession } from "@/lib/auth/dal";
import { REFERRAL_COOKIE, REFERRAL_DOMAINS, isReferralEnabled, parseReferralCookie } from "./config";

/** Adresse e-mail ramenée à sa forme canonique (casse, variantes Gmail). */
export function canonicalEmail(email: string): string {
  const [local, domain = ""] = email.trim().toLowerCase().split("@");
  const isGmail = domain === "gmail.com" || domain === "googlemail.com";
  const base = local.split("+")[0];
  return `${isGmail ? base.replace(/\./g, "") : base}@${isGmail ? "gmail.com" : domain}`;
}

/**
 * Parrain à enregistrer sur un NOUVEAU compte, d'après le lien suivi (cookie
 * posé par le proxy). Refusé (null) si le parrainage est désactivé, si le
 * code n'existe pas, si c'est la même personne (même adresse e-mail, y
 * compris ses variantes Gmail) ou si le parrain est lui-même connecté dans
 * ce navigateur. L'adresse IP n'est jamais utilisée : plusieurs personnes
 * partagent légitimement un téléphone ou un réseau.
 */
export async function referralForNewAccount(newEmail: string) {
  if (!isReferralEnabled()) return null;
  const attribution = parseReferralCookie((await cookies()).get(REFERRAL_COOKIE)?.value);
  if (!attribution) return null;

  const referrer = await prisma.user.findUnique({ where: { referralCode: attribution.code }, select: { id: true, email: true } });
  if (!referrer) return null;
  if (canonicalEmail(referrer.email) === canonicalEmail(newEmail)) return null;
  const session = await verifySession();
  if (session?.userId === referrer.id) return null;

  return { referredById: referrer.id, referralDomain: REFERRAL_DOMAINS[attribution.domain], referredAt: new Date() };
}

/** Attribution consommée : le cookie est retiré une fois le compte créé. */
export async function clearReferralCookie() {
  (await cookies()).delete(REFERRAL_COOKIE);
}
