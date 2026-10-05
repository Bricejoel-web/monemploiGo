import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/dal";
import { MIN_WITHDRAWAL_FCFA, REFERRAL_COMMISSION_FCFA, WITHDRAWAL_DELAY_TEXT, isReferralEnabled } from "@/lib/referral/config";
import { anonymousNumber, getOrCreateReferralCode, getReferralBalance } from "@/lib/referral/balance";
import { documentLabel } from "@/lib/pro/document-kinds";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { StatCard } from "@/components/pro/DashboardParts";
import { GiftIcon } from "@/components/referral/icons";
import { ReferralShare } from "@/components/referral/ReferralShare";
import { WithdrawalForm } from "@/components/referral/WithdrawalForm";
import { SITE_URL } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/parrainage",
  title: "Parrainer & gagner | monemploiGo",
  description: "Recommandez MonEmploiGo et gagnez 200 FCFA par document éligible acheté.",
  noindex: true,
  frenchOnly: true,
});

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} FCFA`;
const STATUS = { PENDING: "En attente", PAID: "Payé", REJECTED: "Refusé" } as const;
const METHOD = { MTN_MOMO: "MTN Mobile Money", ORANGE_MONEY: "Orange Money" } as const;

const STEPS = [
  ["Choisissez votre recommandation", "Sélectionnez le contexte correspondant à la personne que vous souhaitez inviter."],
  ["Partagez votre lien", "Envoyez votre lien personnel par WhatsApp ou copiez-le."],
  ["La personne découvre MonEmploiGo", "Elle arrive sur une page adaptée au domaine que vous avez choisi."],
  ["Elle effectue un achat", "Lorsqu'elle achète un document éligible, votre récompense est enregistrée."],
  ["Vous pouvez demander votre paiement", `À partir de ${MIN_WITHDRAWAL_FCFA} FCFA, vous pouvez demander un retrait.`],
] as const;

const section = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-white/5";

export default async function ReferralPage({ searchParams }: PageProps<"/[locale]/parrainage">) {
  if (!isReferralEnabled()) notFound();
  const session = await requireSession("fr");
  const { retrait } = await searchParams;

  const [code, balance, referredCount, commissions, withdrawals] = await Promise.all([
    getOrCreateReferralCode(session.userId),
    getReferralBalance(session.userId),
    prisma.user.count({ where: { referredById: session.userId } }),
    prisma.referralCommission.findMany({ where: { referrerId: session.userId }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.withdrawalRequest.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="bg-[#efe6d8] py-8 dark:bg-black">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6">
        <div>
          <Link href="/fr/tableau-de-bord" className="text-sm text-black/60 hover:underline dark:text-white/60">
            ← Tableau de bord
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <GiftIcon className="h-7 w-7 text-[#eb5757]" />
            Parrainer &amp; gagner
          </h1>
          <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
            Recommandez MonEmploiGo aux personnes qui ont besoin d&apos;un CV ou d&apos;une lettre de motivation et gagnez {REFERRAL_COMMISSION_FCFA} FCFA pour chaque document
            éligible acheté grâce à votre recommandation.
          </p>
        </div>

        {retrait === "1" && (
          <p role="status" className="rounded-2xl border border-emerald-300/70 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-100">
            Votre demande de paiement est enregistrée. Le montant est réservé jusqu&apos;à son traitement.
          </p>
        )}

        <section aria-label="Mes gains" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Solde disponible"
            value={fcfa(balance.available)}
            detail={balance.toRecover > 0 ? "Montant à récupérer sur vos prochaines récompenses (récompense annulée après un remboursement)." : undefined}
          />
          <StatCard label="En attente" value={fcfa(balance.pending)} />
          <StatCard label="Personnes recommandées" value={String(referredCount)} />
          <StatCard label="Total gagné" value={fcfa(balance.totalEarned)} />
        </section>

        <section className={section}>
          <h2 className="text-lg font-semibold">À qui souhaitez-vous envoyer votre recommandation ?</h2>
          <p className="mt-1 mb-4 text-sm text-black/65 dark:text-white/65">
            Choisissez le contexte qui correspond à la personne à qui vous allez envoyer votre lien. Sa page d&apos;arrivée sera adaptée à son besoin.
          </p>
          <ReferralShare code={code} siteUrl={SITE_URL} />
          <p className="mt-4 text-xs text-black/55 dark:text-white/55">
            En partageant votre lien, vous acceptez les{" "}
            <Link href="/fr/conditions-parrainage" className="font-medium underline">
              conditions du programme « Parrainer &amp; gagner »
            </Link>
            .
          </p>
        </section>

        <section className={section}>
          <h2 className="text-lg font-semibold">Comment ça marche ?</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-sm font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-black/65 dark:text-white/65">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-black/55 dark:text-white/55">
            {REFERRAL_COMMISSION_FCFA} FCFA par CV ou lettre de motivation éligible, sans limite d&apos;achats pour une même personne recommandée.
          </p>
        </section>

        <section className={section}>
          <h2 className="text-lg font-semibold">Historique des gains</h2>
          {commissions.length === 0 ? (
            <p className="mt-3 text-sm text-black/60 dark:text-white/60">Aucun gain pour le moment.</p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-xs text-black/55 uppercase dark:text-white/55">
                <tr>
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">Achat</th>
                  <th className="py-2 text-right font-semibold">Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 whitespace-nowrap">{formatLongDate(c.createdAt, "fr")}</td>
                    <td className="py-2">
                      {documentLabel(c.documentType, null)}
                      <span className="block text-xs text-black/50 dark:text-white/50">Utilisateur recommandé #{anonymousNumber(c.referredUserId)}</span>
                    </td>
                    <td className={`py-2 text-right font-semibold whitespace-nowrap ${c.status === "CANCELLED" ? "text-black/40 line-through dark:text-white/40" : "text-emerald-700 dark:text-emerald-300"}`}>
                      +{fcfa(c.amountFcfa)}
                      {c.status === "CANCELLED" && <span className="block text-xs font-normal no-underline">Annulé (achat remboursé)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={section}>
          <h2 className="text-lg font-semibold">Retirer mes gains</h2>
          <p className="mt-1 mb-4 text-sm text-black/65 dark:text-white/65">
            Solde disponible : <strong>{fcfa(balance.available)}</strong> · Minimum de retrait : {fcfa(MIN_WITHDRAWAL_FCFA)}. Le paiement est envoyé à la main par MonEmploiGo sur votre
            numéro Mobile Money, sans frais pour vous : vous recevez le montant demandé.
          </p>
          <p className="-mt-2 mb-4 text-sm font-medium">{WITHDRAWAL_DELAY_TEXT}</p>
          <WithdrawalForm available={balance.available} minimum={MIN_WITHDRAWAL_FCFA} />
          {withdrawals.length > 0 && (
            <ul className="mt-6 divide-y divide-black/5 text-sm dark:divide-white/10">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {formatLongDate(w.createdAt, "fr")} · {METHOD[w.method]}
                  </span>
                  <span className="font-semibold">
                    {fcfa(w.amountFcfa)} · {STATUS[w.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
