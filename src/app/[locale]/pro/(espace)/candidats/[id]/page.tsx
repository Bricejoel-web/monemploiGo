import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { ProButton } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Dossier candidat | MonEmploiGo Pro",
  description: "Dossier d'un candidat.",
  noindex: true,
  frenchOnly: true,
});

// Phase 3 : consultation du dossier. Modifier / Archiver / Supprimer
// (phase 4) et documents (phase 5) : affichés « Bientôt » d'ici là.
export default async function CandidatePage({ params }: PageProps<"/[locale]/pro/candidats/[id]">) {
  const account = await requireProAccount();
  const { id } = await params;
  // Candidat d'un autre compte (ou inexistant) : introuvable, sans rien révéler.
  const candidate = await getOwnedCandidate(account.id, id);
  if (!candidate) notFound();

  const info: [string, string | null][] = [
    ["Email", candidate.email],
    ["Téléphone", candidate.phone],
    ["Pays de destination", candidate.destinationCountry],
    ["Domaine professionnel", candidate.professionalField],
    ["Type de candidature", candidate.applicationType],
    ["Niveau d'études", candidate.educationLevel],
    ["Langues", candidate.languages],
    ["Niveau d'allemand", candidate.germanLevel],
  ];
  const subtitle = [candidate.applicationType, candidate.professionalField].filter(Boolean).join(" ");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <Link href="/fr/pro/candidats" className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Mes candidats
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {candidate.destinationCountry && <p className="mt-1 font-medium">{candidate.destinationCountry}</p>}
            {subtitle && <p className="text-sm text-black/60 dark:text-white/60">{subtitle}</p>}
            <p className="mt-2 text-xs text-black/50 dark:text-white/50">
              {candidate.status === "ACTIVE" ? "Actif" : "Archivé"} · Dernière modification le {formatLongDate(candidate.updatedAt, "fr")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ProButton href="#" label="Modifier" available={false} />
            <ProButton href="#" label="Archiver" available={false} />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Informations du candidat</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {info.map(([label, value]) => (
            <div key={label}>
              <dt className="text-black/50 dark:text-white/50">{label}</dt>
              <dd className="font-medium break-words">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Documents</h2>
          <ProButton href="#" label="Créer un document" available={false} />
        </div>
        {candidate._count.documents === 0 && <p className="mt-3 text-sm text-black/60 dark:text-white/60">Aucun document pour ce candidat.</p>}
      </section>
    </div>
  );
}
