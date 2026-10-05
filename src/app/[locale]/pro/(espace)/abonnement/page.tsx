import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { requireProAccount } from "@/lib/pro/dal";
import { getProAccess } from "@/lib/pro/subscription";
import { DAY_MS, PRO_STARTER } from "@/lib/pro/plans";
import { refreshPendingPayments } from "@/lib/payment/settle";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { Notice, ProPageHeader, StatusBadge, type StatusTone } from "@/components/pro/DashboardParts";
import { ProSubscriptionPayment } from "@/components/pro/ProSubscriptionPayment";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/abonnement",
  title: "Mon abonnement | MonEmploiGo Pro",
  description: "Abonnement Pro Starter de votre espace professionnel.",
  noindex: true,
  frenchOnly: true,
});

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} FCFA`;
const date = (d: Date) => formatLongDate(d, "fr");

const PAYMENT_STATUS: Record<string, string> = { SUCCESS: "Confirmé", PENDING: "En attente", FAILED: "Échoué ou annulé" };

// « Mon abonnement » (CGU Pro, articles 5 à 8 et 12) : état réel lu en base,
// récapitulatif complet et règle de remboursement avant chaque paiement,
// historique des paiements de CE compte Pro.
export default async function ProSubscriptionPage({ searchParams }: PageProps<"/[locale]/pro/abonnement">) {
  const account = await requireProAccount();
  const { paiement } = await searchParams;

  // Règle d'abord les paiements en attente (client revenu par un autre
  // chemin que la page de retour) : l'état affiché est toujours à jour.
  const { processingPaymentId, processingSince } = await refreshPendingPayments({ userId: account.userId, kind: "PRO_SUBSCRIPTION" });
  const [access, payments] = await Promise.all([
    getProAccess(account.id),
    prisma.payment.findMany({
      where: { professionalAccountId: account.id, kind: "PRO_SUBSCRIPTION" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, amountFcfa: true, status: true, subscription: { select: { startsAt: true, expiresAt: true } } },
    }),
  ]);

  const status: { tone: StatusTone; label: string } =
    access.state === "active"
      ? { tone: "active", label: "Actif" }
      : access.state === "none"
        ? { tone: "inactive", label: "Non activé" }
        : { tone: "expired", label: "Expiré" };

  // Début de la prochaine période (article 8) : à la suite de l'accès en
  // cours, sinon le jour de la confirmation du paiement.
  const renewing = access.state === "active";
  const nextStart = renewing ? access.accessUntil : new Date();
  const nextEnd = new Date(nextStart.getTime() + PRO_STARTER.periodDays * DAY_MS);
  const suspended = account.status === "SUSPENDED";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <ProPageHeader
        title={
          <>
            <h1 className="text-2xl font-bold">Mon abonnement</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="rounded-full bg-[#16324f] px-3 py-1 text-xs font-bold tracking-wide text-white dark:bg-white dark:text-[#16324f]">{PRO_STARTER.name}</span>
              <StatusBadge tone={status.tone} label={status.label} />
            </div>
          </>
        }
      />

      {paiement === "confirme" && access.state === "active" && (
        <Notice tone="info">
          <p className="font-semibold">Paiement confirmé : votre abonnement Pro Starter est actif jusqu&apos;au {date(access.accessUntil)}.</p>
        </Notice>
      )}
      {paiement === "echec" && (
        <Notice tone="danger">
          <p className="font-semibold">Le paiement n&apos;a pas abouti. Aucun abonnement n&apos;a été activé.</p>
          <p className="mt-1">Vous pouvez réessayer ci-dessous.</p>
        </Notice>
      )}
      {paiement === "non-finalise" && (
        <Notice tone="warning">
          <p className="font-semibold">Le paiement n&apos;a pas été finalisé.</p>
          <p className="mt-1">Si vous avez validé la demande sur votre téléphone, la confirmation peut prendre quelques minutes : cette page se met à jour.</p>
        </Notice>
      )}

      <section aria-label="Situation actuelle" className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Situation actuelle</h2>
        {access.state === "active" && (
          <div className="mt-2 space-y-1 text-sm text-black/75 dark:text-white/75">
            <p>
              Accès complet jusqu&apos;au <strong>{date(access.accessUntil)}</strong>.
            </p>
            <p>
              Période en cours : du {date(access.period.startsAt)} au {date(access.period.expiresAt)} · {access.period.documentsUsed} / {PRO_STARTER.maxDocumentsPerPeriod} documents finalisés.
            </p>
            <p>Sans renouvellement automatique : aucun paiement n&apos;a lieu sans votre action.</p>
          </div>
        )}
        {access.state === "none" && <p className="mt-2 text-sm text-black/75 dark:text-white/75">Aucun abonnement pour le moment. Activez Pro Starter pour gérer vos candidats et vos documents.</p>}
        {access.state === "readonly" && (
          <p className="mt-2 text-sm text-black/75 dark:text-white/75">
            Expiré le {date(access.expiredAt)}. Votre espace est en lecture seule jusqu&apos;au <strong>{date(access.deletionAt)}</strong>, puis vos candidats et vos documents seront
            supprimés définitivement. Un renouvellement rétablit immédiatement l&apos;accès complet.
          </p>
        )}
        {access.state === "lapsed" && <p className="mt-2 text-sm text-black/75 dark:text-white/75">Expiré le {date(access.expiredAt)}. Renouvelez pour utiliser de nouveau MonEmploiGo Pro.</p>}
      </section>

      <section aria-label="Récapitulatif avant paiement" className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">{renewing ? "Renouveler Pro Starter" : "Activer Pro Starter"}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/55 dark:text-white/55">Offre</dt>
            <dd className="font-semibold">{PRO_STARTER.name}</dd>
          </div>
          <div>
            <dt className="text-black/55 dark:text-white/55">Prix</dt>
            <dd className="font-semibold">
              {fcfa(PRO_STARTER.priceFcfa)} ({PRO_STARTER.currency}) / {PRO_STARTER.periodDays} jours
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-black/55 dark:text-white/55">Période payée</dt>
            <dd className="font-semibold">
              {renewing
                ? `Du ${date(nextStart)} au ${date(nextEnd)}, à la suite de votre période en cours, sans perte de jours.`
                : `${PRO_STARTER.periodDays} jours à partir de la confirmation du paiement (si elle a lieu aujourd'hui : jusqu'au ${date(nextEnd)}).`}
            </dd>
          </div>
        </dl>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-black/75 dark:text-white/75">
          <li>Jusqu&apos;à {PRO_STARTER.maxActiveCandidates} candidats actifs simultanément.</li>
          <li>Jusqu&apos;à {PRO_STARTER.maxDocumentsPerPeriod} documents finalisés par période. Le quota non utilisé n&apos;est pas reporté.</li>
          <li>Sans renouvellement automatique.</li>
          <li>Activation uniquement après confirmation du paiement par Notch Pay et vérification par nos systèmes.</li>
        </ul>

        <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Règle de remboursement (CGU Pro, article 12)</p>
          <p className="mt-1">
            Si aucun document n&apos;a été finalisé pendant la période payée, vous pouvez demander un remboursement au support, pendant cette période, en indiquant la
            référence du paiement. Dès qu&apos;au moins un document Pro a été finalisé et rendu téléchargeable, aucun remboursement volontaire n&apos;est accordé, sauf
            problème technique ou service inaccessible du fait de MonEmploiGo, paiement débité sans activation, double paiement, montant incorrect, ou tout autre cas
            imposé par la loi. La suppression de l&apos;espace Pro ne donne pas droit à un remboursement, sauf dans ces mêmes cas.
          </p>
        </div>

        {suspended ? (
          <p className="mt-4 text-sm text-red-700 dark:text-red-400">Votre espace professionnel est suspendu : le paiement est indisponible. Contactez le support.</p>
        ) : (
          <ProSubscriptionPayment
            amountLabel={fcfa(PRO_STARTER.priceFcfa)}
            processingPaymentId={processingPaymentId}
            processingSinceIso={processingSince}
          />
        )}
        <p className="mt-3 text-xs text-black/55 dark:text-white/55">
          En payant, vous acceptez les{" "}
          <Link href="/fr/pro/conditions-utilisation" target="_blank" className="font-medium underline">
            conditions d&apos;utilisation de MonEmploiGo Pro
          </Link>
          .
        </p>
      </section>

      <section aria-label="Historique des paiements" className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Historique des paiements</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucun paiement pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10 text-sm dark:divide-white/10">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {date(p.createdAt)} · {fcfa(p.amountFcfa)} · {PAYMENT_STATUS[p.status]}
                  </p>
                  <p className="text-xs break-all text-black/55 dark:text-white/55">Référence : {p.id}</p>
                </div>
                {p.subscription && (
                  <p className="shrink-0 text-xs text-black/60 dark:text-white/60">
                    Période du {date(p.subscription.startsAt)} au {date(p.subscription.expiresAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-black/55 dark:text-white/55">
          Une question sur un paiement ? Écrivez à{" "}
          <a href="mailto:monemploigo.contact@gmail.com" className="font-medium underline">
            monemploigo.contact@gmail.com
          </a>{" "}
          en indiquant sa référence.
        </p>
      </section>
    </div>
  );
}
