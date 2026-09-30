import Link from "next/link";
import { requireProAccount } from "@/lib/pro/dal";
import { getProOverview } from "@/lib/pro/subscription";
import { createCandidate } from "@/lib/pro/candidate-actions";
import { pageMetadata } from "@/lib/seo";
import { CandidateForm } from "@/components/pro/CandidateForm";
import { Notice } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats/nouveau",
  title: "Nouveau candidat | MonEmploiGo Pro",
  description: "Création d'un dossier candidat.",
  noindex: true,
  frenchOnly: true,
});

export default async function NewCandidatePage() {
  const account = await requireProAccount();
  const { access, activeCandidates, maxActiveCandidates } = await getProOverview(account.id);
  const full = activeCandidates >= maxActiveCandidates;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href="/fr/pro/candidats" className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Mes candidats
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouveau candidat</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Candidats actifs : {activeCandidates} / {maxActiveCandidates}
        </p>
      </div>

      {access.state !== "active" ? (
        <Notice tone="warning">
          {access.state === "none"
            ? "Activez Pro Starter pour commencer à gérer vos candidats."
            : "Votre abonnement Pro Starter a expiré : vous ne pouvez plus créer de candidat. Vos dossiers existants restent consultables."}{" "}
          <Link href="/fr/pro/dashboard" className="font-semibold underline">
            Retour au tableau de bord
          </Link>
        </Notice>
      ) : full ? (
        <Notice tone="danger">
          Limite de {maxActiveCandidates} candidats actifs atteinte. Archivez un candidat terminé pour en ajouter un nouveau.{" "}
          <Link href="/fr/pro/candidats?statut=actifs" className="font-semibold underline">
            Voir les candidats actifs
          </Link>
        </Notice>
      ) : (
        <>
          <p className="text-sm text-black/70 dark:text-white/70">
            N&apos;enregistrez que les informations utiles à la candidature, pour une personne qui vous l&apos;a demandé et qui a accepté que ses
            informations soient utilisées pour préparer ses documents.
          </p>
          <CandidateForm action={createCandidate} submitLabel="Créer le candidat" />
        </>
      )}
    </div>
  );
}
