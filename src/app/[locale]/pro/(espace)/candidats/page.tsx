import Link from "next/link";
import { requireProAccount } from "@/lib/pro/dal";
import { getProOverview } from "@/lib/pro/subscription";
import { listCandidates, type CandidateFilter } from "@/lib/pro/candidates";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { ProButton, StatCard } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Mes candidats | MonEmploiGo Pro",
  description: "Liste des candidats de votre structure.",
  noindex: true,
  frenchOnly: true,
});

const FILTERS: { value: CandidateFilter; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "actifs", label: "Actifs" },
  { value: "archives", label: "Archivés" },
];

function StatusPill({ status }: { status: "ACTIVE" | "ARCHIVED" }) {
  return status === "ACTIVE" ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Actif</span>
  ) : (
    <span className="rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-semibold text-black/60 dark:bg-white/10 dark:text-white/60">Archivé</span>
  );
}

const application = (c: { professionalField: string | null; applicationType: string | null }) =>
  [c.applicationType, c.professionalField].filter(Boolean).join(" · ") || "—";

export default async function CandidatesPage({ searchParams }: PageProps<"/[locale]/pro/candidats">) {
  const account = await requireProAccount();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const filter: CandidateFilter = params.statut === "actifs" || params.statut === "archives" ? params.statut : "tous";

  const [overview, candidates] = await Promise.all([getProOverview(account.id), listCandidates(account.id, { query, filter })]);
  const canCreate = overview.access.state === "active" && overview.activeCandidates < overview.maxActiveCandidates;
  const filterHref = (value: CandidateFilter) => `/fr/pro/candidats?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(value !== "tous" ? { statut: value } : {}) })}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Mes candidats</h1>
        <ProButton href="/fr/pro/candidats/nouveau" label="+ Nouveau candidat" available={canCreate} primary />
      </div>

      <div className="max-w-sm">
        <StatCard
          label="Candidats actifs"
          value={`Candidats : ${overview.activeCandidates} / ${overview.maxActiveCandidates}`}
          progress={{ used: overview.activeCandidates, max: overview.maxActiveCandidates }}
          detail={
            overview.access.state !== "active"
              ? "Création de candidats indisponible : abonnement non actif."
              : overview.activeCandidates >= overview.maxActiveCandidates
                ? "Limite atteinte : archivez un candidat terminé pour en ajouter un nouveau."
                : "Les candidats archivés ne comptent pas."
          }
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/fr/pro/candidats" className="flex w-full max-w-md gap-2" role="search">
          {filter !== "tous" && <input type="hidden" name="statut" value={filter} />}
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Rechercher un candidat..."
            aria-label="Rechercher un candidat"
            className="w-full min-w-0 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-[#f2994a] focus:ring-2 focus:ring-[#f2994a]/25 dark:border-white/20 dark:bg-white/5"
          />
          <button type="submit" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
            Rechercher
          </button>
        </form>
        <nav aria-label="Filtrer par statut" className="flex gap-1 rounded-full bg-black/[0.05] p-1 dark:bg-white/10">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={filterHref(f.value)}
              aria-current={filter === f.value ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === f.value ? "bg-white shadow-sm dark:bg-white/20" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/60 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
          {query ? `Aucun candidat ne correspond à « ${query} ».` : filter === "archives" ? "Aucun candidat archivé." : "Aucun candidat pour le moment."}
        </div>
      ) : (
        <>
          {/* Ordinateur : tableau */}
          <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm md:block dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-xs text-black/60 uppercase dark:bg-white/5 dark:text-white/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidat</th>
                  <th className="px-4 py-3 font-semibold">Destination</th>
                  <th className="px-4 py-3 font-semibold">Domaine / type</th>
                  <th className="px-4 py-3 font-semibold">Documents</th>
                  <th className="px-4 py-3 font-semibold">Dernière modification</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium break-words">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-3">{c.destinationCountry ?? "—"}</td>
                    <td className="px-4 py-3">{application(c)}</td>
                    <td className="px-4 py-3">{c._count.documents}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatLongDate(c.updatedAt, "fr")}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/fr/pro/candidats/${c.id}`} className="font-semibold whitespace-nowrap text-[#c94f30] hover:underline">
                        Ouvrir le dossier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cartes */}
          <ul className="flex flex-col gap-3 md:hidden">
            {candidates.map((c) => (
              <li key={c.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold break-words">
                    {c.firstName} {c.lastName}
                  </p>
                  <StatusPill status={c.status} />
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-black/60 dark:text-white/60">
                  <dt>Destination</dt>
                  <dd className="text-black/80 dark:text-white/80">{c.destinationCountry ?? "—"}</dd>
                  <dt>Domaine / type</dt>
                  <dd className="break-words text-black/80 dark:text-white/80">{application(c)}</dd>
                  <dt>Documents</dt>
                  <dd className="text-black/80 dark:text-white/80">{c._count.documents}</dd>
                  <dt>Modifié le</dt>
                  <dd className="text-black/80 dark:text-white/80">{formatLongDate(c.updatedAt, "fr")}</dd>
                </dl>
                <Link href={`/fr/pro/candidats/${c.id}`} className="mt-3 inline-block text-sm font-semibold text-[#c94f30] hover:underline">
                  Ouvrir le dossier
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
