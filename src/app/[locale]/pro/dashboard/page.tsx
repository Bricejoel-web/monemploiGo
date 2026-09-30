import { requireProAccount } from "@/lib/pro/dal";
import { logoutPro } from "@/lib/pro/account-actions";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/dashboard",
  title: "Tableau de bord | MonEmploiGo Pro",
  description: "Espace professionnel MonEmploiGo Pro.",
  noindex: true,
  frenchOnly: true,
});

// Phase 1 (docs/ROADMAP.md) : confirmation que l'espace est créé. Le vrai
// tableau de bord arrive en phase 2 et l'activation de Pro Starter par
// paiement en phases 7-8 — aucun bouton qui ne fonctionne pas encore.
export default async function ProDashboardPage() {
  const account = await requireProAccount();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#c94f30] uppercase">MonEmploiGo Pro</p>
        <h1 className="mt-1 text-2xl font-bold break-words">Bonjour, {account.companyName}</h1>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Votre espace professionnel est prêt.</h2>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">Activez Pro Starter pour commencer à gérer vos candidats et vos documents.</p>
        <p className="mt-4 text-2xl font-bold">
          5 000 FCFA <span className="text-base font-medium text-black/60 dark:text-white/60">/ mois</span>
        </p>
        <p className="mt-3 rounded-lg bg-black/[0.04] p-3 text-xs text-black/60 dark:bg-white/10 dark:text-white/60">
          L&apos;activation de Pro Starter par paiement Mobile Money sera disponible dans une prochaine étape.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 p-6 text-sm sm:grid-cols-2 dark:border-white/15">
        <div>
          <dt className="text-black/50 dark:text-white/50">Responsable</dt>
          <dd className="font-medium break-words">{account.managerName}</dd>
        </div>
        <div>
          <dt className="text-black/50 dark:text-white/50">E-mail professionnel</dt>
          <dd className="font-medium break-words">{account.email}</dd>
        </div>
        <div>
          <dt className="text-black/50 dark:text-white/50">Téléphone</dt>
          <dd className="font-medium">{account.phone}</dd>
        </div>
      </dl>

      <form action={logoutPro}>
        <button type="submit" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Déconnexion
        </button>
      </form>
    </section>
  );
}
