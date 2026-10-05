import "server-only";
import type { Prisma } from "@prisma/client";
import { DAY_MS, PRO_STARTER } from "./plans";
import { computeAccess } from "./subscription";

type Period = { id: string; startsAt: Date; expiresAt: Date; documentsUsed: number };

/**
 * Début de la période payée maintenant (CGU Pro, article 8) : à la fin de
 * l'accès en cours s'il y en a un (renouvellement anticipé, sans perte de
 * jours), sinon au moment de la confirmation du paiement.
 */
export function nextPeriodStart(periods: Period[], now = new Date()): Date {
  const access = computeAccess(periods, now);
  return access.state === "active" ? access.accessUntil : now;
}

/**
 * Active la période payée par ce paiement, dans la transaction qui le fait
 * passer de PENDING à SUCCESS (settlePayment) : une seule activation par
 * paiement, garantie aussi par `Subscription.paymentId` unique.
 *
 * Le compte Pro est verrouillé pour calculer le début de période : deux
 * renouvellements confirmés en même temps s'accolent au lieu de se
 * chevaucher. Le prix enregistré est celui réellement payé (montant déjà
 * comparé à la demande par settlePayment).
 *
 * Espace Pro supprimé entre le paiement et sa confirmation : aucune période
 * n'est créée ; la trace de paiement est conservée (cas « paiement débité
 * mais abonnement non activé » de l'article 12, remboursable).
 */
export async function activateProSubscription(tx: Prisma.TransactionClient, paymentId: string): Promise<boolean> {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    select: { kind: true, professionalAccountId: true, amountFcfa: true },
  });
  if (payment?.kind !== "PRO_SUBSCRIPTION" || !payment.professionalAccountId) return false;

  const accountId = payment.professionalAccountId;
  await tx.$queryRaw`SELECT "id" FROM "ProfessionalAccount" WHERE "id" = ${accountId} FOR UPDATE`;
  if (await tx.subscription.findUnique({ where: { paymentId }, select: { id: true } })) return false;

  const periods = await tx.subscription.findMany({
    where: { professionalAccountId: accountId },
    select: { id: true, startsAt: true, expiresAt: true, documentsUsed: true },
  });
  const startsAt = nextPeriodStart(periods);
  await tx.subscription.create({
    data: {
      professionalAccountId: accountId,
      plan: "PRO_STARTER",
      priceFcfa: payment.amountFcfa,
      currency: PRO_STARTER.currency,
      startsAt,
      expiresAt: new Date(startsAt.getTime() + PRO_STARTER.periodDays * DAY_MS),
      paymentId,
    },
  });
  return true;
}

/**
 * Trace de paiement Pro conservée (politique de confidentialité, section
 * 17) : référence, montant, devise, date, statut, offre et nom de la
 * structure, sans aucune donnée de candidat. Mise à jour à chaque
 * changement de statut ; sans effet pour un paiement de document.
 */
export async function syncProPaymentRecord(db: Prisma.TransactionClient, paymentId: string): Promise<void> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { kind: true, providerRef: true, amountFcfa: true, status: true, professionalAccount: { select: { companyName: true } } },
  });
  if (payment?.kind !== "PRO_SUBSCRIPTION") return;
  const fields = { providerRef: payment.providerRef, amountFcfa: payment.amountFcfa, status: payment.status };
  await db.proPaymentRecord.upsert({
    where: { paymentId },
    // Le nom de la structure est figé à la création : il reste lisible même
    // après la suppression de l'espace.
    create: { paymentId, ...fields, currency: PRO_STARTER.currency, plan: "PRO_STARTER", companyName: payment.professionalAccount?.companyName ?? "" },
    update: fields,
  });
}
