import { requireProAccount } from "@/lib/pro/dal";
import { getProOverview } from "@/lib/pro/subscription";
import { PRO_STARTER, QUOTA_WARNING_RATIO } from "@/lib/pro/plans";
import { proNavItem } from "@/lib/pro/navigation";
import { daysUntil, formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { Notice, ProButton, ProPageHeader, StatCard, StatusBadge, type StatusTone } from "@/components/pro/DashboardParts";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/dashboard",
  title: "Tableau de bord | MonEmploiGo Pro",
  description: "Espace professionnel MonEmploiGo Pro.",
  noindex: true,
  frenchOnly: true,
});

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} FCFA`;
const date = (d: Date) => formatLongDate(d, "fr");

// Tous les chiffres viennent de la base, pour CE compte Pro (getProOverview) :
// aucune donnée d'exemple n'est jamais affichée.
export default async function ProDashboardPage() {
  const account = await requireProAccount();
  const overview = await getProOverview(account.id);
  const { access } = overview;

  const status: { tone: StatusTone; label: string } =
    access.state === "active"
      ? { tone: "active", label: "Actif" }
      : access.state === "none"
        ? { tone: "inactive", label: "Non activé" }
        : { tone: "expired", label: "Expiré" };

  const newCandidate = proNavItem("/fr/pro/candidats/nouveau");
  const subscription = proNavItem("/fr/pro/abonnement");

  const candidateRatio = overview.activeCandidates / overview.maxActiveCandidates;
  const documentRatio = overview.documentsUsed === null ? 0 : overview.documentsUsed / overview.maxDocuments;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <ProPageHeader
        title={
          <>
            <h1 className="text-2xl font-bold break-words">Bonjour, {account.companyName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="rounded-full bg-[#16324f] px-3 py-1 text-xs font-bold tracking-wide text-white dark:bg-white dark:text-[#16324f]">{PRO_STARTER.name}</span>
              <StatusBadge tone={status.tone} label={status.label} />
            </div>
            {access.state === "active" && (
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                Sans renouvellement automatique · Votre accès Pro reste actif jusqu&apos;au {date(access.accessUntil)}.
              </p>
            )}
          </>
        }
      >
        <ProButton href={newCandidate.href} label="Nouveau candidat" available={newCandidate.available && access.state === "active"} primary />
        <ProButton href={subscription.href} label="Mon abonnement" available={subscription.available} />
      </ProPageHeader>

      {access.state === "none" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Votre espace professionnel est prêt.</h2>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">Activez Pro Starter pour commencer à gérer vos candidats et vos documents.</p>
          <p className="mt-4 text-2xl font-bold">
            {fcfa(PRO_STARTER.priceFcfa)} <span className="text-base font-medium text-black/60 dark:text-white/60">/ mois</span>
          </p>
          {!subscription.available && (
            <p className="mt-3 rounded-lg bg-black/[0.04] p-3 text-xs text-black/60 dark:bg-white/10 dark:text-white/60">
              L&apos;activation de Pro Starter par paiement Mobile Money sera disponible dans une prochaine étape.
            </p>
          )}
        </div>
      )}

      {access.state === "readonly" && (
        <Notice tone={daysUntil(access.deletionAt) <= 30 ? "danger" : "warning"}>
          <p className="font-semibold">Votre abonnement Pro Starter a expiré.</p>
          <p className="mt-1">
            Vos candidats et vos documents restent consultables et téléchargeables jusqu&apos;au {date(access.deletionAt)}
            {daysUntil(access.deletionAt) <= 30 && ` (dans ${daysUntil(access.deletionAt)} jour${daysUntil(access.deletionAt) > 1 ? "s" : ""})`}, puis ils seront
            supprimés définitivement. Renouvelez votre abonnement pour continuer à utiliser MonEmploiGo Pro.
          </p>
        </Notice>
      )}

      {access.state === "lapsed" && (
        <Notice tone="warning">
          <p className="font-semibold">Votre abonnement Pro Starter a expiré le {date(access.expiredAt)}.</p>
          <p className="mt-1">Renouvelez votre abonnement pour utiliser de nouveau MonEmploiGo Pro.</p>
        </Notice>
      )}

      <section aria-label="Statistiques" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Candidats actifs"
          value={`${overview.activeCandidates} / ${overview.maxActiveCandidates}`}
          progress={{ used: overview.activeCandidates, max: overview.maxActiveCandidates }}
          detail="Les candidats archivés ne comptent pas."
        />
        <StatCard
          label="Documents utilisés"
          value={overview.documentsUsed === null ? `— / ${overview.maxDocuments}` : `${overview.documentsUsed} / ${overview.maxDocuments}`}
          progress={overview.documentsUsed === null ? undefined : { used: overview.documentsUsed, max: overview.maxDocuments }}
          detail={overview.documentsUsed === null ? "Aucune période en cours." : "Sur la période de 30 jours en cours."}
        />
        <StatCard
          label="Documents disponibles"
          value={String(overview.documentsAvailable)}
          detail={access.state === "active" ? "Jusqu'à la fin de la période." : access.state === "none" ? "Activez Pro Starter." : "Abonnement expiré."}
        />
        <StatCard
          label="Abonnement"
          value={status.label}
          detail={
            access.state === "active"
              ? `Jusqu'au ${date(access.accessUntil)}`
              : access.state === "none"
                ? `${fcfa(PRO_STARTER.priceFcfa)} / mois`
                : `Depuis le ${date(access.expiredAt)}`
          }
        />
      </section>

      <div className="flex flex-col gap-3">
        {candidateRatio >= 1 ? (
          <Notice tone="danger">
            Limite de {overview.maxActiveCandidates} candidats actifs atteinte. Archivez un candidat terminé pour en ajouter un nouveau.
          </Notice>
        ) : (
          candidateRatio >= QUOTA_WARNING_RATIO && (
            <Notice tone="warning">Vous approchez de la limite de {overview.maxActiveCandidates} candidats actifs.</Notice>
          )
        )}
        {documentRatio >= 1 ? (
          <Notice tone="danger">
            Votre quota mensuel est atteint. Consultez votre abonnement pour plus d&apos;informations.
          </Notice>
        ) : (
          documentRatio >= QUOTA_WARNING_RATIO && <Notice tone="warning">Vous approchez de votre limite mensuelle.</Notice>
        )}
      </div>

      <p className="text-xs text-black/50 dark:text-white/50">
        Une question ? Écrivez-nous à{" "}
        <a href="mailto:monemploigo.contact@gmail.com" className="font-medium underline">
          monemploigo.contact@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
