import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireProAccount } from "@/lib/pro/dal";
import { getProAccess } from "@/lib/pro/subscription";
import { documentLabel } from "@/lib/pro/document-kinds";
import { parseDocument } from "@/lib/documents/load-document";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";
import { ProDocumentEditor } from "@/components/pro/ProDocumentEditor";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/documents",
  title: "Modifier un document | MonEmploiGo Pro",
  description: "Modification d'un brouillon.",
  noindex: true,
  frenchOnly: true,
});

// Seul un BROUILLON se modifie : un document finalisé est verrouillé (une
// correction passe par un nouveau document, compté dans le quota).
export default async function EditProDocumentPage({ params }: PageProps<"/[locale]/pro/documents/[docId]/modifier">) {
  const account = await requireProAccount();
  const { docId } = await params;
  const [document, access] = await Promise.all([
    prisma.document.findFirst({
      where: { id: docId, professionalAccountId: account.id },
      include: { candidate: { select: { id: true, firstName: true, lastName: true, status: true } } },
    }),
    getProAccess(account.id),
  ]);
  const loaded = document ? parseDocument(document) : null;
  if (!document || !loaded || !document.candidate) notFound();
  const { candidate } = document;

  const blocked =
    document.status === "FINALIZED"
      ? "Ce document est finalisé : il est verrouillé. Pour une correction, créez un nouveau document."
      : access.state !== "active"
        ? "Votre abonnement Pro Starter n'est pas actif : ce brouillon ne peut plus être modifié."
        : candidate.status !== "ACTIVE"
          ? "Ce candidat est archivé : réactivez-le pour modifier ce brouillon."
          : null;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Link href={`/fr/pro/documents/${document.id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour au document
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {documentLabel(document.type, document.category)} — {candidate.firstName} {candidate.lastName}
        </h1>
      </div>
      {blocked ? (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Notice tone="warning">{blocked}</Notice>
        </div>
      ) : loaded.kind === "CV" ? (
        <ProDocumentEditor kind="CV" templateSlug={document.templateSlug} candidateId={candidate.id} documentId={document.id} data={loaded.data} includePhoto={document.includePhoto} />
      ) : loaded.kind === "CANADA_LETTER" ? null : loaded.kind === "COVER_LETTER" ? (
        <ProDocumentEditor kind="COVER_LETTER" templateSlug={document.templateSlug} candidateId={candidate.id} documentId={document.id} data={loaded.data} />
      ) : (
        <ProDocumentEditor kind="BEWERBUNGSBRIEF" templateSlug={document.templateSlug} candidateId={candidate.id} documentId={document.id} data={loaded.data} />
      )}
    </>
  );
}
