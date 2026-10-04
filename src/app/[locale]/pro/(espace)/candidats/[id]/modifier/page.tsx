import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { getProAccess } from "@/lib/pro/subscription";
import { updateCandidate } from "@/lib/pro/candidate-actions";
import { pageMetadata } from "@/lib/seo";
import { CandidateForm } from "@/components/pro/CandidateForm";
import { Notice } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Modifier un candidat | MonEmploiGo Pro",
  description: "Modification d'un dossier candidat.",
  noindex: true,
  frenchOnly: true,
});

export default async function EditCandidatePage({ params }: PageProps<"/[locale]/pro/candidats/[id]/modifier">) {
  const account = await requireProAccount();
  const { id } = await params;
  const [candidate, access] = await Promise.all([getOwnedCandidate(account.id, id), getProAccess(account.id)]);
  if (!candidate) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href={`/fr/pro/candidats/${candidate.id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour au dossier
        </Link>
        <h1 className="mt-2 text-2xl font-bold break-words">
          Modifier {candidate.firstName} {candidate.lastName}
        </h1>
      </div>

      {access.state !== "active" ? (
        <Notice tone="warning">
          Votre abonnement Pro Starter n&apos;est pas actif : ce dossier reste consultable mais ne peut plus être modifié.
        </Notice>
      ) : (
        <CandidateForm action={updateCandidate.bind(null, candidate.id)} defaults={candidate} submitLabel="Enregistrer les modifications" />
      )}
    </div>
  );
}
