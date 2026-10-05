"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { verifySession } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/security/rate-limit";
import { getReferralBalance } from "./balance";
import { MIN_WITHDRAWAL_FCFA, isReferralEnabled } from "./config";

export type WithdrawalFormState = { message?: string; errors?: Partial<Record<"amount" | "method" | "phone", string[]>> } | undefined;

const WithdrawalSchema = z.object({
  amount: z.coerce
    .number({ error: "Montant invalide." })
    .int({ error: "Montant en francs entiers." })
    .min(MIN_WITHDRAWAL_FCFA, { error: `Le minimum de retrait est de ${MIN_WITHDRAWAL_FCFA} FCFA.` }),
  method: z.enum(["MTN_MOMO", "ORANGE_MONEY"], { error: "Choisissez MTN Mobile Money ou Orange Money." }),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .refine((v) => /^(\+?237)?6\d{8}$/.test(v), { error: "Numéro Mobile Money camerounais invalide (ex. 6XX XX XX XX)." }),
});

/**
 * Demande de retrait : le montant est RÉSERVÉ immédiatement. Le solde
 * disponible est recalculé sous verrou du compte (SELECT … FOR UPDATE) :
 * deux demandes simultanées (double clic, deux onglets) ne peuvent pas
 * réserver deux fois le même argent. Le paiement réel est fait à la main
 * par l'administrateur (aucun paiement automatique).
 */
export async function requestWithdrawal(_state: WithdrawalFormState, formData: FormData): Promise<WithdrawalFormState> {
  if (!isReferralEnabled()) return { message: "Le programme de parrainage n'est pas disponible." };
  const session = await verifySession();
  if (!session) redirect("/fr/connexion");
  if (!rateLimit(`withdrawal:${session.userId}`, 5, 15 * 60 * 1000).allowed) {
    return { message: "Trop de demandes. Réessayez dans quelques minutes." };
  }

  const parsed = WithdrawalSchema.safeParse({ amount: formData.get("amount"), method: formData.get("method"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const { amount, method, phone } = parsed.data;

  const created = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.userId} FOR UPDATE`;
      const { rawAvailable } = await getReferralBalance(session.userId, tx);
      if (amount > rawAvailable) return false;
      await tx.withdrawalRequest.create({
        data: { userId: session.userId, amountFcfa: amount, method, phoneNumber: phone.startsWith("+") ? phone : `+237${phone.replace(/^237/, "")}` },
      });
      return true;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  if (!created) return { message: "Montant supérieur à votre solde disponible." };
  redirect("/fr/parrainage?retrait=1");
}
