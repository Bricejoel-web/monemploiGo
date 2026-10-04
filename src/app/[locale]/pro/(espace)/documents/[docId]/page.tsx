import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/db/client";
import { requireProAccount } from "@/lib/pro/dal";
import { getProOverview } from "@/lib/pro/subscription";
import { finalizeProDocument } from "@/lib/pro/document-actions";
import { documentLabel } from "@/lib/pro/document-kinds";
import { parseDocument } from "@/lib/documents/load-document";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/pro/DashboardParts";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { DocumentPreviewFit } from "@/components/cv/DocumentPreviewFit";
import { DocumentDownload } from "@/components/cv/DocumentDownload";
import { CvFonts } from "@/components/cv/CvFonts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/documents",
  title: "Document | MonEmploiGo Pro",
  description: "Document d'un candidat.",
  noindex: true,
  frenchOnly: true,
});

const ERRORS: Record<string, string> = {
  quota: "Votre quota mensuel est atteint. Consultez votre abonnement pour plus d'informations.",
  inactif: "Votre abonnement Pro Starter n'est pas actif : la finalisation est indisponible.",
  indisponible: "Ce document ne peut plus être finalisé (déjà finalisé, ou candidat archivé).",
};

export default async function ProDocumentPage({ params, searchParams }: PageProps<"/[locale]/pro/documents/[docId]">) {
  const account = await requireProAccount();
  const { docId } = await params;
  const query = await searchParams;

  // Uniquement un document de CE compte Pro.
  const document = await prisma.document.findFirst({
    where: { id: docId, professionalAccountId: account.id },
    include: { candidate: { select: { id: true, firstName: true, lastName: true, status: true } } },
  });
  const loaded = document ? parseDocument(document) : null;
  if (!document || !loaded || !document.candidate) notFound();

  const [overview, dict] = await Promise.all([getProOverview(account.id), getDictionary("fr")]);
  const { candidate } = document;
  const finalized = document.status === "FINALIZED";
  const canEdit = !finalized && overview.access.state === "active" && candidate.status === "ACTIVE";
  const canDownload = finalized && (overview.access.state === "active" || overview.access.state === "readonly");
  const error = typeof query.erreur === "string" ? ERRORS[query.erreur] : undefined;

  const view =
    loaded.kind === "CV" ? (
      <CvRenderer data={loaded.data} layoutId={loaded.template.layoutId} theme={loaded.template.theme} includePhoto={document.includePhoto} locale="fr" />
    ) : loaded.kind === "BEWERBUNGSBRIEF" ? (
      <BewerbungsbriefRenderer data={loaded.data} layoutId={loaded.template.layoutId} theme={loaded.template.theme} locale="fr" />
    ) : (
      <CoverLetterRenderer data={loaded.data} layout={loaded.template.layout} theme={loaded.template.theme} locale="fr" />
    );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <CvFonts />
      <div>
        <Link href={`/fr/pro/candidats/${candidate.id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Dossier de {candidate.firstName} {candidate.lastName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold break-words">
          {documentLabel(document.type, document.category)} — {candidate.firstName} {candidate.lastName}
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Modèle « {loaded.template.name} » ·{" "}
          {finalized && document.finalizedAt
            ? `Finalisé le ${formatLongDate(document.finalizedAt, "fr")} · verrouillé`
            : `Brouillon modifié le ${formatLongDate(document.updatedAt, "fr")}`}
        </p>
      </div>

      {query.finalise === "1" && (
        <Notice tone="info">
          Document finalisé : il est verrouillé et téléchargeable. Documents utilisés sur la période : {overview.documentsUsed ?? "—"} / {overview.maxDocuments}.
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}

      {!finalized && (
        <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm">
            Ce document est un <strong>brouillon</strong> : il ne compte pas encore dans votre quota. Relisez-le, modifiez-le si besoin, puis finalisez-le pour le
            télécharger.
          </p>
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/fr/pro/documents/${document.id}/modifier`}
                className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Modifier
              </Link>
              {overview.documentsAvailable > 0 ? (
                <form action={finalizeProDocument.bind(null, document.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 hover:opacity-95"
                  >
                    Finaliser ce document
                  </button>
                </form>
              ) : (
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">Votre quota mensuel est atteint.</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-black/60 dark:text-white/60">
              {overview.access.state !== "active" ? "Abonnement non actif : ce brouillon ne peut plus être modifié ni finalisé." : "Candidat archivé : réactivez-le pour finaliser ce brouillon."}
            </p>
          )}
          {canEdit && overview.documentsAvailable > 0 && (
            <p className="text-xs text-black/55 dark:text-white/55">
              La finalisation utilise 1 document de votre quota (il en reste {overview.documentsAvailable} sur {overview.maxDocuments} pour cette période). Le document est ensuite
              verrouillé : une correction nécessitera un nouveau document.
            </p>
          )}
        </div>
      )}

      {canDownload && (
        <div className="max-w-md">
          <DocumentDownload
            documentId={document.id}
            locale="fr"
            failed={query.pdf === "erreur"}
            labels={{
              button: dict.download.button,
              preparing: dict.download.preparing,
              done: dict.download.done,
              again: dict.download.again,
              error: dict.download.error,
              print: dict.download.print,
            }}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-xl">
        <p className="mb-3 text-center text-xs font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">Aperçu du document</p>
        <div className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          <DocumentPreviewFit>
            <div className="a4-print-root">{view}</div>
          </DocumentPreviewFit>
        </div>
      </div>
    </div>
  );
}
