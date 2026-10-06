import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { consumeEmailVerificationToken } from "@/lib/auth/email-verification";
import { isAdminEmail } from "@/lib/referral/admin";
import { isReferralEnabled } from "@/lib/referral/config";
import { sendAdminVerificationEmail } from "@/lib/referral/admin-verification-actions";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ locale: "fr", path: "/admin/verification", title: "Vérification | Admin", description: "Administration.", noindex: true, frenchOnly: true });

// Preuve de possession de l'adresse administrateur avant le premier accès à
// l'administration (voir requireAdmin). Le lien reçu par e-mail ne vaut que
// pour le compte connecté.
export default async function AdminVerificationPage({ searchParams }: PageProps<"/[locale]/admin/verification">) {
  if (!isReferralEnabled()) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/fr/connexion");
  if (!isAdminEmail(user.email)) notFound();
  if (user.emailVerifiedAt) redirect("/fr/admin/retraits");

  const { jeton, envoye, erreur } = await searchParams;
  let invalidLink = false;
  if (typeof jeton === "string" && jeton) {
    if (await consumeEmailVerificationToken(jeton, user.id)) redirect("/fr/admin/retraits");
    invalidLink = true;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-12">
      <h1 className="text-2xl font-bold">Confirmez votre adresse e-mail</h1>
      <p className="text-sm text-black/70 dark:text-white/70">
        Avant d&apos;accéder à l&apos;administration, confirmez que l&apos;adresse <strong>{user.email}</strong> vous appartient : nous y envoyons un lien
        valable 1 heure, à ouvrir dans ce même navigateur.
      </p>
      {envoye === "1" && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Lien envoyé. Consultez votre boîte de réception.</p>}
      {erreur === "envoi" && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">L&apos;e-mail n&apos;a pas pu être envoyé. Réessayez plus tard.</p>}
      {erreur === "limite" && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">Trop de demandes. Réessayez dans une heure.</p>}
      {invalidLink && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">Ce lien n&apos;est plus valable. Demandez-en un nouveau.</p>}
      <form action={sendAdminVerificationEmail}>
        <button type="submit" className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white">
          Recevoir le lien de vérification
        </button>
      </form>
    </div>
  );
}
