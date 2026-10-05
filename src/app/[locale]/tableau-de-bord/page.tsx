import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession, getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { DashboardDocuments, type DashboardDocumentItem } from "@/components/dashboard/DashboardDocuments";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { FolderIcon, CheckIcon, ClockIcon } from "@/components/home/icons";
import { expiresAt, retentionCutoff } from "@/lib/documents/retention";
import { refreshPendingPayments } from "@/lib/payment/settle";
import { daysUntil, formatLongDate } from "@/lib/format-date";
import { isEmailEnabled } from "@/lib/email/mailer";
import { MailIcon } from "@/components/home/icons";
import { ReviewPrompt } from "@/components/review/ReviewPrompt";
import type { ComponentType } from "react";
import { isReferralEnabled } from "@/lib/referral/config";
import { getReferralBalance } from "@/lib/referral/balance";
import { FlagCanada, GiftIcon } from "@/components/referral/icons";

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  value: number;
  label: string;
  accent: "brand" | "green" | "amber";
}) {
  const accentClasses = {
    brand: "from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]",
    green: "from-emerald-500/15 to-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    amber: "from-amber-500/15 to-amber-500/15 text-amber-700 dark:text-amber-400",
  }[accent];

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-[#fbfaf8] p-3 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:text-left">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-10 sm:w-10 ${accentClasses}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 break-words text-xs text-black/50 dark:text-white/50">{label}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage({ params, searchParams }: PageProps<"/[locale]/tableau-de-bord">) {
  const { locale } = await params;
  // Retour après « Supprimer mon espace professionnel » (français seul).
  const proSpaceDeleted = locale === "fr" && (await searchParams)["espace-pro"] === "supprime";
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();
  // Un client qui a payé sans repasser par la page de retour (session
  // expirée, autre navigateur...) retrouve ici son document débloqué.
  await refreshPendingPayments({ userId: session.userId });
  // Gains de parrainage non retirés : signalés avant une suppression du compte.
  const referralBalance = await getReferralBalance(session.userId);

  const documents = await prisma.document.findMany({
    // Espace particulier : jamais les documents de l'espace Pro.
    where: { userId: session.userId, professionalAccountId: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      createdAt: true,
      category: true,
      templateSlug: true,
      paidAt: true,
      updatedAt: true,
    },
  });

  // Les documents arrivés à échéance ne sont supprimés qu'au passage de la
  // purge quotidienne : d'ici là, ils ne doivent déjà plus apparaître.
  const cutoff = retentionCutoff();
  const liveDocuments = documents.filter((doc) =>
    doc.status === "PAID" ? !doc.paidAt || doc.paidAt >= cutoff : doc.updatedAt >= cutoff,
  );

  const now = new Date();
  const items: DashboardDocumentItem[] = liveDocuments.map((doc) => {
    const isPaid = doc.status === "PAID";
    const deadline = expiresAt(isPaid ? (doc.paidAt ?? now) : doc.updatedAt);
    const daysLeft = daysUntil(deadline, now);
    const date = formatLongDate(deadline, locale as Locale);
    // Textes calculés côté serveur : le composant client affiche exactement
    // la même chose au rendu serveur et à l'hydratation (pas d'écart de fuseau).
    const retentionNote = !isPaid
      ? { text: dict.retention.draftKeptUntil.replace("{date}", date), urgent: false }
      : daysLeft <= 0
        ? { text: dict.retention.expiresToday, urgent: true }
        : daysLeft === 1
          ? { text: dict.retention.expiresTomorrow, urgent: true }
          : daysLeft <= 3
            ? { text: dict.retention.expiresInDays.replace("{days}", String(daysLeft)), urgent: true }
            : { text: dict.retention.availableUntil.replace("{date}", date), urgent: false };

    return {
      id: doc.id,
      title: doc.title,
      // Uniquement des documents particuliers ici (filtre plus haut) : jamais FINALIZED.
      status: isPaid ? "PAID" : "DRAFT",
      createdOn: formatLongDate(doc.createdAt, locale as Locale),
      retentionNote,
      category: doc.type === "COVER_LETTER" ? "COVER_LETTER" : doc.type === "BEWERBUNGSBRIEF" ? "BEWERBUNGSBRIEF" : doc.category ?? "STANDARD",
      type: doc.type,
      templateSlug: doc.templateSlug,
    };
  });

  // Un compte Gmail récent n'a pas encore de réputation auprès des
  // messageries : l'e-mail de bienvenue peut atterrir dans les spams. On le
  // signale pendant les 24 h qui suivent l'inscription — seulement si l'envoi
  // est réellement configuré, pour ne jamais annoncer un e-mail jamais parti.
  const showWelcomeEmailHint =
    isEmailEnabled() && user !== null && now.getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000;

  // Un seul avis par client : on le demande tant qu'il n'a pas été donné,
  // à propos du document payé le plus récent.
  const existingReview = await prisma.review.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const latestPaid = existingReview
    ? undefined
    : liveDocuments
        .filter((doc) => doc.status === "PAID")
        .sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0))[0];

  const paidCount = items.filter((d) => d.status === "PAID").length;
  const draftCount = items.length - paidCount;
  const initials = (user?.name ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="bg-dot-grid relative min-h-[70vh] bg-[#efe6d8] py-12 dark:bg-white/[0.05]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <div className="animate-fade-in-up flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-xl font-bold text-white shadow-md shadow-[#eb5757]/25">
            {initials}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{dict.dashboard.title}</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              {dict.dashboard.welcome}, {user?.name ?? user?.email}
            </p>
          </div>
        </div>

        {proSpaceDeleted && (
          <p role="status" className="rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-sm dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            Votre espace professionnel a été supprimé. Votre compte particulier et vos documents sont conservés.
          </p>
        )}

        {showWelcomeEmailHint && (
          <p className="animate-fade-in-up flex items-start gap-3 rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-sm dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <span>{dict.dashboard.welcomeEmailSent.replace("{email}", user?.email ?? "")}</span>
          </p>
        )}

        <div
          className="animate-fade-in-up grid grid-cols-3 gap-4"
          style={{ animationDelay: "0.08s" }}
        >
          <StatCard icon={FolderIcon} value={items.length} label={dict.dashboard.statTotal} accent="brand" />
          <StatCard icon={CheckIcon} value={paidCount} label={dict.dashboard.statPaid} accent="green" />
          <StatCard icon={ClockIcon} value={draftCount} label={dict.dashboard.statDraft} accent="amber" />
        </div>

        {latestPaid && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <ReviewPrompt
              documentId={latestPaid.id}
              labels={dict.review}
              locale={locale as Locale}
              subtitle={dict.review.dashboardSubtitle.replace("{title}", latestPaid.title)}
            />
          </div>
        )}

        <section
          aria-labelledby="retention-notice-title"
          className="animate-fade-in-up flex gap-3 rounded-2xl border border-sky-300/60 bg-sky-50 p-4 text-sky-950 shadow-sm dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100 sm:p-5"
          style={{ animationDelay: "0.12s" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
            <ClockIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-sm">
            <h2 id="retention-notice-title" className="font-semibold">{dict.retention.noticeTitle}</h2>
            <p className="mt-1 text-sky-900/80 dark:text-sky-100/80">{dict.retention.noticePaid}</p>
            <p className="mt-1 text-sky-900/80 dark:text-sky-100/80">{dict.retention.noticeDraft}</p>
          </div>
        </section>

        {/* Lettre de présentation Canada : utilisable sans CV MonEmploiGo. */}
        <Link
          href={`/${locale}/lettre-canada`}
          className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06]"
        >
          <FlagCanada className="h-7 w-14" />
          <span>
            <span className="block font-semibold">{dict.canadaLetter.entry}</span>
            <span className="block text-sm text-black/60 dark:text-white/60">{dict.canadaLetter.entryHint}</span>
          </span>
        </Link>

        {/* Parrainage : français uniquement, visible seulement si activé. */}
        {locale === "fr" && isReferralEnabled() && (
          <Link
            href="/fr/parrainage"
            className="flex items-center gap-3 rounded-2xl border border-[#f2994a]/40 bg-[#fbfaf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#f2994a]/30 dark:bg-white/[0.06]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-white">
              <GiftIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Parrainer &amp; gagner</span>
              <span className="block text-sm text-black/60 dark:text-white/60">Recommandez MonEmploiGo et gagnez 200 FCFA par document éligible acheté.</span>
            </span>
          </Link>
        )}

        <div
          className="animate-fade-in-up rounded-2xl border border-black/10 bg-[#fbfaf8] p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
          style={{ animationDelay: "0.16s" }}
        >
          <DashboardDocuments documents={items} dict={dict} locale={locale as Locale} />
        </div>

        <div
          className="animate-fade-in-up rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 dark:border-red-500/25 dark:bg-red-500/[0.06]"
          style={{ animationDelay: "0.24s" }}
        >
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">{dict.dashboard.dangerZoneTitle}</h2>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">{dict.dashboard.dangerZoneText}</p>
          <div className="mt-3">
            <DeleteAccountButton locale={locale as Locale} dict={dict} referralAvailable={referralBalance.available} />
          </div>
        </div>
      </div>
    </div>
  );
}
