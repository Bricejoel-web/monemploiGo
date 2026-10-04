import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { deleteCandidate } from "@/lib/pro/candidate-actions";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Supprimer un candidat | MonEmploiGo Pro",
  description: "Suppression définitive d'un dossier candidat.",
  noindex: true,
  frenchOnly: true,
});

// Confirmation explicite avant suppression définitive (décision validée le
// 2026-09-30) : case à cocher obligatoire, revérifiée côté serveur.
// Disponible même en lecture seule (droit à l'effacement des candidats).
export default async function DeleteCandidatePage({ params, searchParams }: PageProps<"/[locale]/pro/candidats/[id]/supprimer">) {
  const account = await requireProAccount();
  const { id } = await params;
  const { erreur } = await searchParams;
  const candidate = await getOwnedCandidate(account.id, id);
  if (!candidate) notFound();
  const documents = candidate._count.documents;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href={`/fr/pro/candidats/${candidate.id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour au dossier
        </Link>
        <h1 className="mt-2 text-2xl font-bold break-words">
          Supprimer définitivement {candidate.firstName} {candidate.lastName} ?
        </h1>
      </div>

      <div className="rounded-2xl border border-red-300/70 bg-red-50 p-5 text-sm text-red-900 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-100">
        <p className="font-semibold">Attention :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>le candidat sera supprimé ;</li>
          <li>
            ses documents seront supprimés ({documents} document{documents > 1 ? "s" : ""}) ;
          </li>
          <li>cette action est définitive : elle ne peut pas être annulée.</li>
        </ul>
        <p className="mt-3">Les documents déjà finalisés restent comptés dans votre quota de la période en cours.</p>
      </div>

      {erreur === "confirmation" && <Notice tone="danger">Cochez la case de confirmation pour supprimer ce dossier.</Notice>}

      <form action={deleteCandidate.bind(null, candidate.id)} className="flex flex-col gap-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" required className="mt-0.5" />
          <span>Je comprends que la suppression de ce candidat et de ses documents est définitive.</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            Supprimer définitivement
          </button>
          <Link
            href={`/fr/pro/candidats/${candidate.id}`}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
