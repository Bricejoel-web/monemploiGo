import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProAccount } from "@/lib/pro/dal";
import { getOwnedCandidate } from "@/lib/pro/candidates";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { getProAccess } from "@/lib/pro/subscription";
import { archiveCandidate, reactivateCandidate } from "@/lib/pro/candidate-actions";
import { Notice, ProButton } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/candidats",
  title: "Dossier candidat | MonEmploiGo Pro",
  description: "Dossier d'un candidat.",
  noindex: true,
  frenchOnly: true,
});

const NOTICES: Record<string, { tone: "info" | "danger"; text: string }> = {
  modifie: { tone: "info", text: "Les informations du candidat ont été enregistrées." },
  archive: { tone: "info", text: "Le candidat a été archivé : il ne compte plus dans la limite des candidats actifs." },
  reactive: { tone: "info", text: "Le candidat est de nouveau actif." },
  limite: { tone: "danger", text: "Limite de 10 candidats actifs atteinte : archivez un autre candidat avant de réactiver celui-ci." },
  inactif: { tone: "danger", text: "Votre abonnement Pro Starter n'est pas actif : ce dossier ne peut plus être modifié." },
};

// Dossier du candidat. Documents : phase 5 (« Bientôt » d'ici là).
export default async function CandidatePage({ params, searchParams }: PageProps<"/[locale]/pro/candidats/[id]">) {
  const account = await requireProAccount();
  const { id } = await params;
  const query = await searchParams;
  // Candidat d'un autre compte (ou inexistant) : introuvable, sans rien révéler.
  const [candidate, access] = await Promise.all([getOwnedCandidate(account.id, id), getProAccess(account.id)]);
  if (!candidate) notFound();
  const canModify = access.state === "active";
  const noticeKey = ["modifie", "archive", "reactive"].find((k) => query[k] === "1") ?? (typeof query.erreur === "string" ? query.erreur : undefined);
  const notice = noticeKey ? NOTICES[noticeKey] : undefined;
  const buttonClass = "rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

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
            {canModify ? (
              <>
                <Link href={`/fr/pro/candidats/${candidate.id}/modifier`} className={buttonClass}>
                  Modifier
                </Link>
                {candidate.status === "ACTIVE" ? (
                  <form action={archiveCandidate.bind(null, candidate.id)}>
                    <button type="submit" className={buttonClass}>
                      Archiver
                    </button>
                  </form>
                ) : (
                  <form action={reactivateCandidate.bind(null, candidate.id)}>
                    <button type="submit" className={buttonClass}>
                      Réactiver
                    </button>
                  </form>
                )}
              </>
            ) : (
              <p className="text-xs text-black/55 dark:text-white/55">Abonnement non actif : dossier en lecture seule.</p>
            )}
          </div>
        </div>
      </div>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

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

      {/* Toujours possible, même en lecture seule : droit à l'effacement. */}
      <section className="rounded-2xl border border-red-200 p-5 dark:border-red-900/50">
        <h2 className="font-semibold text-red-700 dark:text-red-300">Supprimer ce candidat</h2>
        <p className="mt-1 text-sm text-black/65 dark:text-white/65">
          Supprime définitivement le dossier et tous ses documents, par exemple à la demande du candidat.
        </p>
        <Link
          href={`/fr/pro/candidats/${candidate.id}/supprimer`}
          className="mt-3 inline-block rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
        >
          Supprimer définitivement
        </Link>
      </section>
    </div>
  );
}
