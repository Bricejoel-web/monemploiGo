"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { DocumentIcon, MailIcon, FlagIcon, DownloadIcon, PencilIcon, CheckIcon, ClockIcon } from "@/components/home/icons";

const TYPE_ICONS = {
  CV: DocumentIcon,
  COVER_LETTER: MailIcon,
  BEWERBUNGSBRIEF: FlagIcon,
} as const;

export type DashboardCategory = "ALL" | "STANDARD" | "PREMIUM" | "ATS" | "GERMAN_ATS" | "COVER_LETTER" | "BEWERBUNGSBRIEF";

export interface DashboardDocumentItem {
  id: string;
  title: string;
  category: Exclude<DashboardCategory, "ALL">;
  status: "DRAFT" | "PAID";
  createdAt: string;
  type: "CV" | "COVER_LETTER" | "BEWERBUNGSBRIEF";
  templateSlug: string;
}

export function DashboardDocuments({
  documents,
  dict,
  locale,
}: {
  documents: DashboardDocumentItem[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [filter, setFilter] = useState<DashboardCategory>("ALL");

  const categories: { key: DashboardCategory; label: string }[] = [
    { key: "ALL", label: dict.dashboard.all },
    { key: "STANDARD", label: dict.dashboard.standard },
    { key: "PREMIUM", label: dict.dashboard.premium },
    { key: "ATS", label: dict.dashboard.ats },
    { key: "GERMAN_ATS", label: dict.dashboard.germanAts },
    { key: "COVER_LETTER", label: dict.dashboard.coverLetters },
    { key: "BEWERBUNGSBRIEF", label: dict.dashboard.bewerbungsbrief },
  ];

  const filtered = filter === "ALL" ? documents : documents.filter((d) => d.category === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          {dict.dashboard.categories}
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilter(cat.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                filter === cat.key
                  ? "border-transparent bg-gradient-to-r from-[#f2994a] to-[#eb5757] text-white shadow-sm shadow-[#eb5757]/25"
                  : "border-black/10 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          {dict.dashboard.myDocuments}
        </h2>

        {documents.some((doc) => doc.status === "PAID") && (
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">{dict.payment.wordHint}</p>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/20">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
              <DocumentIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">{dict.dashboard.noDocuments}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href={`/${locale}/cv`}
                className="btn-shine rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.04]"
              >
                {dict.dashboard.browseCvs}
              </Link>
              <Link
                href={`/${locale}/lettres-de-motivation`}
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
              >
                {dict.dashboard.browseCoverLetters}
              </Link>
              <Link
                href={`/${locale}/bewerbungsbrief`}
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
              >
                {dict.dashboard.browseBewerbungsbrief}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((doc) => {
              const TypeIcon = TYPE_ICONS[doc.type];
              const isPaid = doc.status === "PAID";
              return (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-background/60 px-4 py-3 text-sm transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
                      <TypeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {dict.dashboard.createdOn} {new Date(doc.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {isPaid ? <CheckIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
                      {dict.dashboard.status[doc.status]}
                    </span>
                    {isPaid ? (
                      <Link
                        href={`/${locale}/document/${doc.id}/apercu`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold text-black/80 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        {dict.payment.downloadPdf}
                      </Link>
                    ) : (
                      <Link
                        href={`/${locale}/${
                          doc.type === "COVER_LETTER" ? "lettres-de-motivation" : doc.type === "BEWERBUNGSBRIEF" ? "bewerbungsbrief" : "cv"
                        }/modele/${doc.templateSlug}?documentId=${doc.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#eb5757]/20 transition-transform hover:scale-[1.04]"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        {dict.dashboard.continueDocument}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
