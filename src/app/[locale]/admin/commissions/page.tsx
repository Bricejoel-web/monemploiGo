import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/referral/admin";
import { cancelCommission } from "@/lib/referral/admin-actions";
import { documentLabel } from "@/lib/pro/document-kinds";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ locale: "fr", path: "/admin/commissions", title: "Commissions de parrainage | Admin", description: "Administration.", noindex: true, frenchOnly: true });

// Recherche par référence de paiement (Notch Pay ou interne) pour annuler la
// commission d'un achat remboursé ou annulé. Rien n'est supprimé.
export default async function AdminCommissionsPage({ searchParams }: PageProps<"/[locale]/admin/commissions">) {
  await requireAdmin();
  const query = await searchParams;
  const ref = typeof query.paiement === "string" ? query.paiement.trim().slice(0, 100) : "";
  const commissions = await prisma.referralCommission.findMany({
    where: ref ? { payment: { OR: [{ id: ref }, { providerRef: ref }] } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { referrer: { select: { referralCode: true } }, payment: { select: { id: true, providerRef: true, amountFcfa: true } } },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Commissions de parrainage</h1>
        <Link href="/fr/admin/retraits" className="text-sm font-semibold underline">
          Retraits
        </Link>
      </div>
      {query.annulee && <p className="rounded-xl bg-black/[0.04] p-3 text-sm dark:bg-white/10">Commission annulée et inscrite au journal.</p>}
      {query.erreur && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Indiquez un motif (3 caractères au moins).</p>}
      <form className="flex flex-wrap gap-2" action="/fr/admin/commissions">
        <input name="paiement" defaultValue={ref} placeholder="Référence du paiement (trx… ou identifiant)" className="w-full max-w-md rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/20 dark:bg-white/5" />
        <button type="submit" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold dark:border-white/20">
          Rechercher
        </button>
      </form>
      <ul className="flex flex-col gap-3">
        {commissions.map((c) => (
          <li key={c.id} className="rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <p className="font-semibold">
              {c.amountFcfa} FCFA · {documentLabel(c.documentType, null)} · parrain {c.referrer?.referralCode ?? "compte supprimé"} · {c.status === "VALID" ? "Valide" : "Annulée"}
            </p>
            <p className="text-xs text-black/55 dark:text-white/55">
              {formatLongDate(c.createdAt, "fr")} · paiement {c.payment?.providerRef ?? c.payment?.id ?? "supprimé"}
              {c.cancelReason && ` · motif : ${c.cancelReason}`}
            </p>
            {c.status === "VALID" && (
              <form action={cancelCommission.bind(null, c.id)} className="mt-2 flex flex-wrap gap-2">
                <input name="reason" required minLength={3} maxLength={200} placeholder="Motif (ex. achat remboursé)" className="rounded-full border border-black/15 px-3 py-1.5 text-xs dark:border-white/20 dark:bg-white/5" />
                <button type="submit" className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
                  Annuler (remboursement)
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
