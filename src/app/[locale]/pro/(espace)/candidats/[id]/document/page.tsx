import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { getProAccess } from "@/lib/pro/subscription";
import { PRO_DOCUMENT_KINDS } from "@/lib/pro/document-kinds";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Créer un document | MonEmploiGo Pro",
  description: "Choix du type de document.",
  noindex: true,
  frenchOnly: true,
});

export default async function ChooseDocumentTypePage({ params }: PageProps<"/[locale]/pro/candidats/[id]/document">) {
  const account = await requireProAccount();
  const { id } = await params;
  const [candidate, access] = await Promise.all([getOwnedCandidate(account.id, id), getProAccess(account.id)]);
  if (!candidate) notFound();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href={`/fr/pro/candidats/${candidate.id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Dossier de {candidate.firstName} {candidate.lastName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Créer un document</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Les informations du dossier sont reprises automatiquement dans le formulaire. Le document reste un brouillon jusqu&apos;à sa finalisation.
        </p>
      </div>

      {access.state !== "active" ? (
        <Notice tone="warning">Votre abonnement Pro Starter n&apos;est pas actif : la création de documents est indisponible.</Notice>
      ) : candidate.status !== "ACTIVE" ? (
        <Notice tone="warning">Ce candidat est archivé : réactivez-le pour lui créer un document.</Notice>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRO_DOCUMENT_KINDS.map((kind) => (
            <li key={kind.slug}>
              <Link
                href={`/fr/pro/candidats/${candidate.id}/document/${kind.slug}`}
                className="flex h-full flex-col gap-1 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <span className="font-semibold">{kind.label}</span>
                <span className="text-sm text-black/60 dark:text-white/60">{kind.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
