"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { refreshPendingPayments } from "@/lib/payment/settle";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireProAccount } from "./dal";
import { structureFields } from "./space-fields";
import { parseLogoDataUrl } from "./logo";

export type ProSettingsState =
  | { errors?: Partial<Record<"companyName" | "managerName" | "email" | "phone", string[]>>; message?: string; saved?: boolean }
  | undefined;

const SettingsSchema = z.object(structureFields);

/**
 * Informations de la structure. Toujours modifiables, y compris en lecture
 * seule : ce ne sont pas des données de candidats, et l'adresse e-mail sert
 * à recevoir les avertissements d'expiration. Le compte est celui de la
 * session, jamais un identifiant envoyé par le navigateur.
 */
export async function updateProSettings(_state: ProSettingsState, formData: FormData): Promise<ProSettingsState> {
  const account = await requireProAccount();
  if (!(await rateLimit(`pro-settings:${account.id}`, 20, 15 * 60 * 1000)).allowed) {
    return { message: "Trop de modifications en peu de temps. Réessayez dans quelques minutes." };
  }
  const validated = SettingsSchema.safeParse({
    companyName: formData.get("companyName"),
    managerName: formData.get("managerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  await prisma.professionalAccount.update({ where: { id: account.id }, data: validated.data });
  revalidatePath("/fr/pro", "layout");
  return { saved: true };
}

export type ProLogoState = { error?: string; saved?: boolean } | undefined;

/**
 * Logo de la structure (facultatif, espace Pro uniquement). Comme les
 * informations de la structure, modifiable même en lecture seule.
 */
export async function updateProLogo(_state: ProLogoState, formData: FormData): Promise<ProLogoState> {
  const account = await requireProAccount();
  if (!(await rateLimit(`pro-logo:${account.id}`, 20, 15 * 60 * 1000)).allowed) {
    return { error: "Trop de modifications en peu de temps. Réessayez dans quelques minutes." };
  }
  if (formData.get("remove") === "1") {
    await prisma.professionalAccount.update({ where: { id: account.id }, data: { logoDataUrl: null } });
  } else {
    const logo = parseLogoDataUrl(formData.get("logo"));
    if (!logo) return { error: "Image refusée : choisissez un logo au format PNG, JPEG ou WebP." };
    await prisma.professionalAccount.update({ where: { id: account.id }, data: { logoDataUrl: logo } });
  }
  revalidatePath("/fr/pro", "layout");
  return { saved: true };
}

/**
 * « Supprimer mon espace professionnel » (CGU Pro, article 16) : après une
 * confirmation explicite, revérifiée ici. Efface la structure, ses
 * candidats, ses documents et ses périodes ; le compte particulier reste.
 * Les traces de paiement Pro (ProPaymentRecord) sont conservées.
 *
 * Refusée tant qu'un paiement d'abonnement est en cours de confirmation :
 * sinon il serait débité sans pouvoir activer de période.
 */
export async function deleteProSpace(formData: FormData) {
  const account = await requireProAccount();
  if (formData.get("confirm") !== "on") redirect("/fr/pro/parametres/supprimer?erreur=confirmation");

  const { processingPaymentId } = await refreshPendingPayments({ userId: account.userId, kind: "PRO_SUBSCRIPTION" });
  const pending = await prisma.payment.count({
    where: { professionalAccountId: account.id, kind: "PRO_SUBSCRIPTION", status: "PENDING", providerRef: { not: null }, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (processingPaymentId || pending > 0) redirect("/fr/pro/parametres/supprimer?erreur=paiement");

  await prisma.professionalAccount.deleteMany({ where: { id: account.id, userId: account.userId } });
  redirect("/fr/tableau-de-bord?espace-pro=supprime");
}
