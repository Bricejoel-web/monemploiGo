import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/referral/admin";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ locale: "fr", path: "/admin/retraits", title: "Retraits de parrainage | Admin", description: "Administration.", noindex: true, frenchOnly: true });

const METHOD = { MTN_MOMO: "MTN Mobile Money", ORANGE_MONEY: "Orange Money" } as const;
const STATUS = { PENDING: "En attente", PAID: "Payé", REJECTED: "Refusé" } as const;

export default async function AdminWithdrawalsPage({ searchParams }: PageProps<"/[locale]/admin/retraits">) {
  await requireAdmin();
  const { statut } = await searchParams;
  const status = statut === "PAID" || statut === "REJECTED" ? statut : statut === "tous" ? undefined : "PENDING";
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, referralCode: true } } },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Retraits de parrainage</h1>
        <Link href="/fr/admin/commissions" className="text-sm font-semibold underline">
          Commissions
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filtrer">
        {[["PENDING", "En attente"], ["PAID", "Payés"], ["REJECTED", "Refusés"], ["tous", "Tous"]].map(([value, label]) => (
          <Link
            key={value}
            href={`/fr/admin/retraits?statut=${value}`}
            className={`rounded-full border px-3 py-1 ${(status ?? "tous") === value ? "border-[#f2994a] bg-[#f2994a]/10 font-semibold" : "border-black/15 dark:border-white/20"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {withdrawals.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">Aucune demande.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase dark:bg-white/5">
              <tr>
                <th className="px-3 py-2">Utilisateur</th>
                <th className="px-3 py-2">Montant</th>
                <th className="px-3 py-2">Méthode</th>
                <th className="px-3 py-2">Numéro</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="px-3 py-2">
                    {w.user.referralCode ?? "—"}
                    <span className="block text-xs text-black/55 dark:text-white/55">{w.user.email}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold">{w.amountFcfa} FCFA</td>
                  <td className="px-3 py-2">{METHOD[w.method]}</td>
                  <td className="px-3 py-2 font-mono">{w.phoneNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatLongDate(w.createdAt, "fr")}</td>
                  <td className="px-3 py-2">{STATUS[w.status]}</td>
                  <td className="px-3 py-2">
                    <Link href={`/fr/admin/retraits/${w.id}`} className="font-semibold text-[#c94f30] hover:underline">
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
