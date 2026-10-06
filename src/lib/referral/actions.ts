"use server";

import { z } from "zod";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/db/client";
import { verifySession } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/security/rate-limit";
import { getReferralBalance } from "./balance";
import { MIN_WITHDRAWAL_FCFA, isReferralEnabled } from "./config";

export type WithdrawalFormState = { message?: string; errors?: Partial<Record<"amount" | "method" | "phone" | "password", string[]>> } | undefined;

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
  // Protection du parrain : 5 tentatives par heure et par compte (compteur
  // partagé en base), qu'elles aboutissent ou non.
  if (!(await rateLimit(`withdrawal:${session.userId}`, 5, 60 * 60 * 1000)).allowed) {
    return { message: "Trop de tentatives. Réessayez plus tard." };
  }

  const parsed = WithdrawalSchema.safeParse({ amount: formData.get("amount"), method: formData.get("method"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const { amount, method, phone } = parsed.data;

  // Mot de passe redemandé : une session volée (ordinateur partagé, cookie
  // dérobé) ne suffit pas à envoyer les gains vers un autre numéro.
  const owner = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { passwordHash: true, email: true } });
  if (!(await verifyPassword(String(formData.get("password") ?? ""), owner.passwordHash))) {
    return { errors: { password: ["Mot de passe incorrect."] } };
  }

  const created = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.userId} FOR UPDATE`;
      const { rawAvailable } = await getReferralBalance(session.userId, tx);
      if (amount > rawAvailable) return false;
      const { referralCode } = await tx.user.findUniqueOrThrow({ where: { id: session.userId }, select: { referralCode: true } });
      await tx.withdrawalRequest.create({
        data: { userId: session.userId, userCode: referralCode, amountFcfa: amount, method, phoneNumber: phone.startsWith("+") ? phone : `+237${phone.replace(/^237/, "")}` },
      });
      return true;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  if (!created) return { message: "Montant supérieur à votre solde disponible." };
  // Alerte au parrain : s'il n'est pas l'auteur de la demande, il le sait
  // tout de suite (le paiement est fait à la main, sous 72 h, et peut être refusé).
  const last = phone.replace(/\D/g, "").slice(-2);
  const lines = [
    `Une demande de retrait de ${amount} FCFA vers le numéro se terminant par ${last} a été enregistrée sur votre compte monemploiGo.`,
    "Si vous n'êtes pas à l'origine de cette demande, répondez immédiatement à cet e-mail ou écrivez à monemploigo.contact@gmail.com, et changez votre mot de passe.",
  ];
  after(() => sendEmail({ to: owner.email, subject: "Demande de retrait enregistrée — monemploiGo", text: lines.join("\n\n"), html: lines.map((l) => `<p>${l}</p>`).join("") }));
  redirect("/fr/parrainage?retrait=1");
}
