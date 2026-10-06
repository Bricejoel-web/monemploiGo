import Link from "next/link";
import type { ReactNode } from "react";
import { QUOTA_WARNING_RATIO } from "@/lib/pro/plans";

// Éléments d'affichage du tableau de bord Pro (serveur, sans état).

export function ProPageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">{title}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const buttonBase = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors";

/**
 * Bouton vers une rubrique : grisé tant qu'elle est inaccessible, avec la
 * raison (« Bientôt » si elle n'existe pas encore, sinon `lockedReason`,
 * par exemple quand l'abonnement n'est pas actif).
 */
export function ProButton({ href, label, available, primary = false, lockedReason }: { href: string; label: string; available: boolean; primary?: boolean; lockedReason: string }) {
  if (!available) {
    return (
      <span aria-disabled="true" className={`${buttonBase} cursor-not-allowed border border-black/10 text-black/35 dark:border-white/15 dark:text-white/35`}>
        {label}
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] dark:bg-white/10">{lockedReason}</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={
        primary
          ? `${buttonBase} bg-gradient-to-r from-[#f2994a] to-[#eb5757] text-white shadow-sm shadow-[#eb5757]/25 hover:opacity-95`
          : `${buttonBase} border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`
      }
    >
      {label}
    </Link>
  );
}

export type StatusTone = "active" | "expired" | "inactive";

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const color = { active: "bg-emerald-500", expired: "bg-red-500", inactive: "bg-black/30 dark:bg-white/40" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function StatCard({ label, value, detail, progress }: { label: string; value: string; detail?: string; progress?: { used: number; max: number } }) {
  const ratio = progress ? Math.min(1, progress.used / progress.max) : 0;
  const barColor = ratio >= 1 ? "bg-red-500" : ratio >= QUOTA_WARNING_RATIO ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-black/60 dark:text-white/60">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {progress && (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={progress.max}
          aria-valuenow={progress.used}
          className="h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10"
        >
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
      {detail && <p className="text-xs text-black/55 dark:text-white/55">{detail}</p>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "info" | "warning" | "danger"; children: ReactNode }) {
  const style = {
    info: "border-sky-300/60 bg-sky-50 text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100",
    warning: "border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100",
    danger: "border-red-300/70 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200",
  }[tone];
  return (
    <div role={tone === "info" ? "status" : "alert"} className={`rounded-2xl border p-4 text-sm ${style}`}>
      {children}
    </div>
  );
}
