import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { getProAccess } from "@/lib/pro/subscription";
import { proDocumentKind } from "@/lib/pro/document-kinds";
import { prefillBewerbungsbrief, prefillCoverLetter, prefillCv } from "@/lib/pro/prefill";
import { getBewerbungsbriefBySlug, getCoverLetterBySlug, getCvTemplateBySlug } from "@/lib/cv/catalog";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";
import { ProDocumentEditor } from "@/components/pro/ProDocumentEditor";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Nouveau document | MonEmploiGo Pro",
  description: "Création d'un document pour un candidat.",
  noindex: true,
  frenchOnly: true,
});

export default async function NewProDocumentPage({ params }: PageProps<"/[locale]/pro/candidats/[id]/document/[type]/[slug]">) {
  const account = await requireProAccount();
  const { id, type, slug } = await params;
  const kind = proDocumentKind(type);
  const [candidate, access] = await Promise.all([getOwnedCandidate(account.id, id), getProAccess(account.id)]);
  if (!candidate || !kind) notFound();

  // Le modèle doit appartenir au type choisi (ex. un modèle ATS pour « CV ATS »).
  const templateOk =
    kind.kind === "CV" ? getCvTemplateBySlug(slug)?.category === kind.category : kind.kind === "COVER_LETTER" ? Boolean(getCoverLetterBySlug(slug)) : Boolean(getBewerbungsbriefBySlug(slug));
  if (!templateOk) notFound();

  const header = (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Link href={`/fr/pro/candidats/${candidate.id}/document/${kind.slug}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
        ← Choisir un autre modèle
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {kind.label} — {candidate.firstName} {candidate.lastName}
      </h1>
    </div>
  );

  if (access.state !== "active" || candidate.status !== "ACTIVE") {
    return (
      <>
        {header}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Notice tone="warning">
            {access.state !== "active"
              ? "Votre abonnement Pro Starter n'est pas actif : la création de documents est indisponible."
              : "Ce candidat est archivé : réactivez-le pour lui créer un document."}
          </Notice>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      {kind.kind === "CV" ? (
        <ProDocumentEditor kind="CV" templateSlug={slug} candidateId={candidate.id} data={await prefillCv(candidate)} />
      ) : kind.kind === "COVER_LETTER" ? (
        <ProDocumentEditor kind="COVER_LETTER" templateSlug={slug} candidateId={candidate.id} data={await prefillCoverLetter(candidate)} />
      ) : (
        <ProDocumentEditor kind="BEWERBUNGSBRIEF" templateSlug={slug} candidateId={candidate.id} data={await prefillBewerbungsbrief(candidate)} />
      )}
    </>
  );
}
