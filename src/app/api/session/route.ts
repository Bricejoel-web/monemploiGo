import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/dal";
import { SESSION_HINT_COOKIE } from "@/lib/auth/session-hint";
import { isAdminEmail } from "@/lib/referral/admin";
import { isReferralEnabled } from "@/lib/referral/config";

/**
 * Informations du compte connecté pour l'en-tête (pages publiques statiques) :
 * nom, e-mail et droit d'accès à l'administration. Jamais mises en cache.
 * Session absente ou révoquée : l'indicateur « connecté » est effacé.
 */
export async function GET() {
  const session = await verifySession();
  const headers = { "Cache-Control": "private, no-store" };
  if (!session) {
    const response = NextResponse.json({ loggedIn: false }, { headers });
    response.cookies.delete(SESSION_HINT_COOKIE);
    return response;
  }
  return NextResponse.json(
    { loggedIn: true, name: session.name, email: session.email, isAdmin: isReferralEnabled() && isAdminEmail(session.email) },
    { headers },
  );
}
