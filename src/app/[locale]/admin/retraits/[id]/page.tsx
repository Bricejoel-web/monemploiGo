import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/referral/admin";
import { markWithdrawalPaid, rejectWithdrawal } from "@/lib/referral/admin-actions";
import { getReferralBalance } from "@/lib/referral/balance";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ locale: "fr", path: "/admin/retraits", title: "Demande de retrait | Admin", description: "Administration.", noindex: true, frenchOnly: true });

const METHOD = { MTN_MOMO: "MTN Mobile Money", ORANGE_MONEY: "Orange Money" } as const;
const STATUS = { PENDING: "En attente", PAID: "Payé", REJECTED: "Refusé" } as const;

export default async function AdminWithdrawalPage({ params, searchParams }: PageProps<"/[locale]/admin/retraits/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, referralCode: true } }, auditLogs: { orderBy: { createdAt: "asc" } } },
  });
  if (!withdrawal) notFound();
  const balance = withdrawal.user ? await getReferralBalance(withdrawal.user.id) : null;
  const notice = query.paye ? "Retrait marqué comme payé." : query.refuse ? "Retrait refusé : le montant est de nouveau disponible pour l'utilisateur." : query.deja ? "Cette demande a déjà été traitée." : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <Link href="/fr/admin/retraits" className="text-sm underline">
        ← Retraits
      </Link>
      <h1 className="text-2xl font-bold">Demande de retrait</h1>
      {notice && <p className="rounded-xl bg-black/[0.04] p-3 text-sm dark:bg-white/10">{notice}</p>}
      <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-white p-5 text-sm sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
        {[
          ["Utilisateur", withdrawal.user ? `${withdrawal.userCode ?? withdrawal.user.referralCode ?? "—"} (${withdrawal.user.email})` : `${withdrawal.userCode ?? "—"} (compte supprimé)`],
          ["Montant", `${withdrawal.amountFcfa} FCFA`],
          ["Méthode", METHOD[withdrawal.method]],
          ["Numéro Mobile Money", withdrawal.phoneNumber],
          ["Date de la demande", formatLongDate(withdrawal.createdAt, "fr")],
          ["Statut", STATUS[withdrawal.status]],
          ["Total gagné par l'utilisateur", balance ? `${balance.totalEarned} FCFA` : "—"],
          ["Déjà payé", balance ? `${balance.paidOut} FCFA` : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-black/55 dark:text-white/55">{label}</dt>
            <dd className="font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {withdrawal.status === "PENDING" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-black/65 dark:text-white/65">
            Envoyez d&apos;abord le paiement Mobile Money à la main, puis confirmez ici. Le refus rend le montant de nouveau disponible pour l&apos;utilisateur.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={markWithdrawalPaid.bind(null, withdrawal.id)}>
              <button type="submit" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Marquer comme payé
              </button>
            </form>
            <form action={rejectWithdrawal.bind(null, withdrawal.id)}>
              <button type="submit" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Refuser
              </button>
            </form>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-semibold">Journal</h2>
        {withdrawal.auditLogs.length === 0 ? (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucune décision pour le moment.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {withdrawal.auditLogs.map((log) => (
              <li key={log.id}>
                {log.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC · {log.oldStatus} → {log.newStatus} · {log.amountFcfa} FCFA · par {log.adminEmail}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
