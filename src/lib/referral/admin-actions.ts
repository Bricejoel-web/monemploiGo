"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "./admin";

// Décisions de l'administrateur. Chaque changement de statut ne se fait
// qu'à partir du statut attendu (une seule fois, même en double clic) et
// est inscrit au journal d'audit, dans la même transaction.

async function decideWithdrawal(withdrawalId: string, newStatus: "PAID" | "REJECTED") {
  const admin = await requireAdmin();
  const done = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      select: { id: true, amountFcfa: true, status: true, userCode: true, user: { select: { referralCode: true } } },
    });
    if (!withdrawal) return false;
    const { count } = await tx.withdrawalRequest.updateMany({
      where: { id: withdrawalId, status: "PENDING" },
      data: { status: newStatus, processedAt: new Date(), processedById: admin.id },
    });
    if (count === 0) return false;
    await tx.referralAuditLog.create({
      data: {
        withdrawalId,
        adminId: admin.id,
        adminEmail: admin.email,
        action: newStatus === "PAID" ? "WITHDRAWAL_PAID" : "WITHDRAWAL_REJECTED",
        oldStatus: "PENDING",
        newStatus,
        amountFcfa: withdrawal.amountFcfa,
        userCode: withdrawal.userCode ?? withdrawal.user?.referralCode ?? null,
      },
    });
    return true;
  });
  redirect(`/fr/admin/retraits/${withdrawalId}?${done ? (newStatus === "PAID" ? "paye=1" : "refuse=1") : "deja=1"}`);
}

/** Le paiement Mobile Money a été fait à la main : le montant n'est plus disponible. */
export async function markWithdrawalPaid(withdrawalId: string) {
  await decideWithdrawal(withdrawalId, "PAID");
}

/** Refus : le montant réservé redevient disponible pour l'utilisateur. */
export async function rejectWithdrawal(withdrawalId: string) {
  await decideWithdrawal(withdrawalId, "REJECTED");
}

/**
 * Annulation d'une commission (achat remboursé ou annulé) : elle n'est plus
 * comptée, mais reste dans l'historique avec le motif — jamais supprimée.
 */
export async function cancelCommission(commissionId: string, formData: FormData) {
  const admin = await requireAdmin();
  const reason = z.string().trim().min(3).max(200).safeParse(formData.get("reason"));
  if (!reason.success) redirect(`/fr/admin/commissions?erreur=motif`);

  await prisma.$transaction(async (tx) => {
    const commission = await tx.referralCommission.findUnique({ where: { id: commissionId }, select: { amountFcfa: true, referrer: { select: { referralCode: true } } } });
    if (!commission) return;
    const { count } = await tx.referralCommission.updateMany({
      where: { id: commissionId, status: "VALID" },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason.data },
    });
    if (count === 0) return;
    await tx.referralAuditLog.create({
      data: {
        commissionId,
        adminId: admin.id,
        adminEmail: admin.email,
        action: "COMMISSION_CANCELLED",
        oldStatus: "VALID",
        newStatus: "CANCELLED",
        amountFcfa: commission.amountFcfa,
        userCode: commission.referrer?.referralCode ?? null,
      },
    });
  });
  redirect("/fr/admin/commissions?annulee=1");
}
