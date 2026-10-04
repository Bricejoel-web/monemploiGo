import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { requireProAccount } from "@/lib/pro/dal";
import { PRO_DOCUMENT_KINDS, documentLabel } from "@/lib/pro/document-kinds";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/documents",
  title: "Documents | MonEmploiGo Pro",
  description: "Historique des documents de votre structure.",
  noindex: true,
  frenchOnly: true,
});

const PERIODS = { "30j": { label: "30 derniers jours", days: 30 }, "90j": { label: "3 derniers mois", days: 90 }, "365j": { label: "12 derniers mois", days: 365 } } as const;
type PeriodKey = keyof typeof PERIODS;

/** Début de la période de filtre (calculé à chaque requête). */
const periodStart = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const inputClass = "rounded-full border border-black/15 bg-white px-4 py-2 text-sm dark:border-white/20 dark:bg-white/5";

function StatusPill({ finalized }: { finalized: boolean }) {
  return finalized ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Finalisé</span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">Brouillon</span>
  );
}

export default async function ProDocumentsPage({ searchParams }: PageProps<"/[locale]/pro/documents">) {
  const account = await requireProAccount();
  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 100) : "");
  const query = str(params.q);
  const kind = PRO_DOCUMENT_KINDS.find((k) => k.slug === str(params.type));
  const candidateId = str(params.candidat);
  const period = str(params.periode) in PERIODS ? (str(params.periode) as PeriodKey) : undefined;

  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const where: Prisma.DocumentWhereInput = {
    // Toujours limité à CE compte Pro.
    professionalAccountId: account.id,
    ...(kind ? { type: kind.kind, ...(kind.category ? { category: kind.category } : {}) } : {}),
    ...(candidateId ? { candidateId } : {}),
    ...(period ? { updatedAt: { gte: periodStart(PERIODS[period].days) } } : {}),
    AND: words.map((word) => ({
      OR: [
        { title: { contains: word, mode: "insensitive" as const } },
        { candidate: { firstName: { contains: word, mode: "insensitive" as const } } },
        { candidate: { lastName: { contains: word, mode: "insensitive" as const } } },
      ],
    })),
  };

  const [documents, candidates] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, type: true, category: true, status: true, updatedAt: true, finalizedAt: true, candidate: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.professionalCandidate.findMany({ where: { professionalAccountId: account.id }, orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-bold">Documents</h1>

      <form action="/fr/pro/documents" role="search" className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <input name="q" type="search" defaultValue={query} placeholder="Rechercher un document..." aria-label="Rechercher un document" className={`${inputClass} w-full lg:max-w-xs`} />
        <select name="type" defaultValue={kind?.slug ?? ""} aria-label="Type" className={inputClass}>
          <option value="">Tous les types</option>
          {PRO_DOCUMENT_KINDS.map((k) => (
            <option key={k.slug} value={k.slug}>
              {k.label}
            </option>
          ))}
        </select>
        <select name="candidat" defaultValue={candidateId} aria-label="Candidat" className={inputClass}>
          <option value="">Tous les candidats</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <select name="periode" defaultValue={period ?? ""} aria-label="Période" className={inputClass}>
          <option value="">Toute période</option>
          {Object.entries(PERIODS).map(([key, p]) => (
            <option key={key} value={key}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Filtrer
        </button>
      </form>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/60 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
          {query || kind || candidateId || period ? "Aucun document ne correspond à ces critères." : "Aucun document pour le moment. Créez-en un depuis le dossier d'un candidat."}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm md:block dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-xs text-black/60 uppercase dark:bg-white/5 dark:text-white/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Candidat</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium">{documentLabel(d.type, d.category)}</td>
                    <td className="px-4 py-3">{d.candidate ? `${d.candidate.firstName} ${d.candidate.lastName}` : "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatLongDate(d.finalizedAt ?? d.updatedAt, "fr")}</td>
                    <td className="px-4 py-3">
                      <StatusPill finalized={d.status === "FINALIZED"} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/fr/pro/documents/${d.id}`} className="font-semibold text-[#c94f30] hover:underline">
                        {d.status === "FINALIZED" ? "Voir / Télécharger" : "Voir"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {documents.map((d) => (
              <li key={d.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{documentLabel(d.type, d.category)}</p>
                  <StatusPill finalized={d.status === "FINALIZED"} />
                </div>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">{d.candidate ? `${d.candidate.firstName} ${d.candidate.lastName}` : "—"}</p>
                <p className="text-xs text-black/55 dark:text-white/55">{formatLongDate(d.finalizedAt ?? d.updatedAt, "fr")}</p>
                <Link href={`/fr/pro/documents/${d.id}`} className="mt-2 inline-block text-sm font-semibold text-[#c94f30] hover:underline">
                  {d.status === "FINALIZED" ? "Voir / Télécharger" : "Voir"}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
