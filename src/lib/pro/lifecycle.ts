import "server-only";
import { prisma } from "@/lib/db/client";
import { sendProExpiryEmail, type ProExpiryEmailKind } from "@/lib/email/pro-expiry-email";
import { DAY_MS, LOCKED_TRANSACTION, READ_ONLY_DAYS } from "./plans";
import { computeAccess } from "./subscription";

/** Ordre des avertissements (CGU Pro, article 11). */
const NOTICE_ORDER: ProExpiryEmailKind[] = ["EXPIRED", "DELETION_IN_30_DAYS", "DELETION_IN_7_DAYS"];

/** Avertissements dus à cette date, du premier au plus urgent. */
export function dueNotices(deletionAt: Date, now: Date): ProExpiryEmailKind[] {
  const left = deletionAt.getTime() - now.getTime();
  return NOTICE_ORDER.filter((kind) => kind === "EXPIRED" || (kind === "DELETION_IN_30_DAYS" ? left <= 30 * DAY_MS : left <= 7 * DAY_MS));
}

/**
 * Tâche quotidienne de l'espace Pro, lancée par le cron de purge :
 *
 * 1. Avertissements : un seul envoi par échéance et par expiration
 *    (`ProExpiryNotice` unique). Si un passage du cron a été manqué, seul
 *    le plus urgent part ; les précédents sont notés comme dépassés, pour
 *    ne pas envoyer trois e-mails le même jour. Sans envoi d'e-mails
 *    configuré, l'avertissement reste visible dans le tableau de bord.
 *
 * 2. Suppression au terme des 90 jours de lecture seule : candidats,
 *    brouillons et documents de l'espace Pro. Les informations de la
 *    structure et l'historique des abonnements sont conservés tant que le
 *    compte existe (politique de confidentialité, section 17). L'état est
 *    revérifié sous verrou, et rien n'est supprimé si un renouvellement est
 *    en cours de paiement.
 */
export async function runProLifecycle(now = new Date()) {
  const cutoff = new Date(now.getTime() - READ_ONLY_DAYS * DAY_MS);
  const accounts = await prisma.professionalAccount.findMany({
    where: {
      OR: [
        // En lecture seule : une période a expiré depuis moins de 90 jours.
        { subscriptions: { some: { expiresAt: { gte: cutoff, lte: now } } } },
        // À purger : toutes les périodes ont expiré depuis plus de 90 jours
        // et il reste des données (quelle que soit l'ancienneté).
        { subscriptions: { some: {}, every: { expiresAt: { lt: cutoff } } }, OR: [{ candidates: { some: {} } }, { documents: { some: {} } }] },
      ],
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      subscriptions: { select: { id: true, startsAt: true, expiresAt: true, documentsUsed: true } },
    },
  });

  let emailsSent = 0;
  let purgedAccounts = 0;
  const renewUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/fr/pro/abonnement`;

  for (const account of accounts) {
    const access = computeAccess(account.subscriptions, now);

    if (access.state === "readonly") {
      const due = dueNotices(access.deletionAt, now);
      const recorded = await prisma.proExpiryNotice.findMany({
        where: { professionalAccountId: account.id, expiredAt: access.expiredAt },
        select: { kind: true },
      });
      const latest = due[due.length - 1];
      if (latest && !recorded.some((n) => n.kind === latest)) {
        // Réservation d'abord (contrainte unique) : deux passages simultanés
        // du cron n'envoient jamais deux fois le même avertissement.
        const reserved = await prisma.proExpiryNotice
          .create({ data: { professionalAccountId: account.id, kind: latest, expiredAt: access.expiredAt } })
          .catch(() => null);
        if (reserved) {
          await prisma.proExpiryNotice.createMany({
            data: due.slice(0, -1).map((kind) => ({ professionalAccountId: account.id, kind, expiredAt: access.expiredAt })),
            skipDuplicates: true,
          });
          // Sans envoi configuré, sendEmail ne fait rien et renvoie faux.
          const sent = await sendProExpiryEmail({
            to: account.email,
            companyName: account.companyName,
            kind: latest,
            expiredAt: access.expiredAt,
            deletionAt: access.deletionAt,
            renewUrl,
          });
          if (sent) {
            emailsSent++;
            await prisma.proExpiryNotice.update({ where: { id: reserved.id }, data: { emailSent: true } });
          }
        }
      }
    }

    if (access.state === "lapsed" && (await purgeLapsedAccount(account.id, now))) purgedAccounts++;
  }

  return { proAccountsChecked: accounts.length, proEmailsSent: emailsSent, proAccountsPurged: purgedAccounts };
}

async function purgeLapsedAccount(accountId: string, now: Date): Promise<boolean> {
  const renewalPending = await prisma.payment.count({
    where: { professionalAccountId: accountId, kind: "PRO_SUBSCRIPTION", status: "PENDING", createdAt: { gte: new Date(now.getTime() - 2 * DAY_MS) } },
  });
  if (renewalPending > 0) return false;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "ProfessionalAccount" WHERE "id" = ${accountId} FOR UPDATE`;
    const periods = await tx.subscription.findMany({
      where: { professionalAccountId: accountId },
      select: { id: true, startsAt: true, expiresAt: true, documentsUsed: true },
    });
    if (computeAccess(periods, now).state !== "lapsed") return false;
    const documents = await tx.document.deleteMany({ where: { professionalAccountId: accountId } });
    const candidates = await tx.professionalCandidate.deleteMany({ where: { professionalAccountId: accountId } });
    return documents.count + candidates.count > 0;
  }, LOCKED_TRANSACTION);
}
