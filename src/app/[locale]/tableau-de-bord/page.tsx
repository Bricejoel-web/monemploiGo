import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession, getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { DashboardDocuments, type DashboardDocumentItem } from "@/components/dashboard/DashboardDocuments";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { FolderIcon, CheckIcon, ClockIcon } from "@/components/home/icons";
import type { ComponentType } from "react";

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

export default async function DashboardPage({ params }: PageProps<"/[locale]/tableau-de-bord">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  const documents = await prisma.document.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      createdAt: true,
      category: true,
      templateSlug: true,
    },
  });

  const items: DashboardDocumentItem[] = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    category: doc.type === "COVER_LETTER" ? "COVER_LETTER" : doc.type === "BEWERBUNGSBRIEF" ? "BEWERBUNGSBRIEF" : doc.category ?? "STANDARD",
    type: doc.type,
    templateSlug: doc.templateSlug,
  }));

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

        <div
          className="animate-fade-in-up grid grid-cols-3 gap-4"
          style={{ animationDelay: "0.08s" }}
        >
          <StatCard icon={FolderIcon} value={items.length} label={dict.dashboard.statTotal} accent="brand" />
          <StatCard icon={CheckIcon} value={paidCount} label={dict.dashboard.statPaid} accent="green" />
          <StatCard icon={ClockIcon} value={draftCount} label={dict.dashboard.statDraft} accent="amber" />
        </div>

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
            <DeleteAccountButton locale={locale as Locale} dict={dict} />
          </div>
        </div>
      </div>
    </div>
  );
}
