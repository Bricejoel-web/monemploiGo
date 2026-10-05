import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { requireProAccount } from "@/lib/pro/dal";
import { getProAccess } from "@/lib/pro/subscription";
import { deleteProSpace } from "@/lib/pro/settings-actions";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/parametres",
  title: "Supprimer mon espace professionnel | MonEmploiGo Pro",
  description: "Suppression définitive de l'espace professionnel.",
  noindex: true,
  frenchOnly: true,
});

// Confirmation explicite (CGU Pro, article 16) : mentions complètes, chiffres
// réels de CE compte, case obligatoire revérifiée côté serveur.
export default async function DeleteProSpacePage({ searchParams }: PageProps<"/[locale]/pro/parametres/supprimer">) {
  const account = await requireProAccount();
  const { erreur } = await searchParams;
  const [access, candidates, documents] = await Promise.all([
    getProAccess(account.id),
    prisma.professionalCandidate.count({ where: { professionalAccountId: account.id } }),
    prisma.document.count({ where: { professionalAccountId: account.id } }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href="/fr/pro/parametres" className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour aux paramètres
        </Link>
        <h1 className="mt-2 text-2xl font-bold break-words">Supprimer l&apos;espace professionnel de {account.companyName} ?</h1>
      </div>

      <div className="rounded-2xl border border-red-300/70 bg-red-50 p-5 text-sm text-red-900 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-100">
        <p className="font-semibold">Attention :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>les informations de la structure seront supprimées ;</li>
          <li>
            vos candidats ({candidates}) et leurs documents ({documents}) seront supprimés ;
          </li>
          <li>cette action est définitive : elle ne peut pas être annulée ;</li>
          {access.state === "active" && <li>votre période d&apos;abonnement en cours (jusqu&apos;au {formatLongDate(access.accessUntil, "fr")}) sera perdue, sous réserve de l&apos;article 12 des CGU Pro ;</li>}
          <li>votre compte MonEmploiGo particulier n&apos;est pas supprimé ;</li>
          <li>les traces de paiement imposées par la loi sont conservées, sans aucune donnée de candidat.</li>
        </ul>
      </div>

      {erreur === "confirmation" && <Notice tone="danger">Cochez la case de confirmation pour supprimer votre espace professionnel.</Notice>}
      {erreur === "paiement" && (
        <Notice tone="warning">Un paiement d&apos;abonnement est en cours de confirmation. Attendez son issue (quelques minutes) avant de supprimer votre espace.</Notice>
      )}

      <form action={deleteProSpace} className="flex flex-col gap-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" required className="mt-0.5" />
          <span>Je comprends que la suppression de mon espace professionnel, de mes candidats et de leurs documents est définitive.</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            Supprimer définitivement
          </button>
          <Link
            href="/fr/pro/parametres"
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
