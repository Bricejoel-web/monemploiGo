"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/layout/Logo";
import { logoutPro } from "@/lib/pro/account-actions";
import { PRO_NAV } from "@/lib/pro/navigation";
import { CloseIcon, LogoutIcon, MenuIcon, NAV_ICONS } from "./icons";
import { ProLogo } from "./ProLogo";

function Brand({ id }: { id: string }) {
  return (
    <Link href="/fr/pro/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark size={26} gradientId={`pro-logo-${id}`} />
      <span className="text-[17px]">
        <span className="text-[#16324f] dark:text-white">monemploi</span>
        <span className="font-bold text-[#eb5757]">Go</span>
        <span className="ml-1.5 rounded-md bg-[#16324f] px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase dark:bg-white dark:text-[#16324f]">Pro</span>
      </span>
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Espace professionnel" className="flex flex-col gap-1">
      {PRO_NAV.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = pathname === item.href;
        if (!item.available) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/35 dark:text-white/35"
            >
              <Icon />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold dark:bg-white/10">Bientôt</span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-[#16324f] text-white dark:bg-white dark:text-[#16324f]" : "text-black/75 hover:bg-black/[0.05] dark:text-white/75 dark:hover:bg-white/10"
            }`}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
      <form action={logoutPro} className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/75 transition-colors hover:bg-black/[0.05] dark:text-white/75 dark:hover:bg-white/10"
        >
          <LogoutIcon />
          Déconnexion
        </button>
      </form>
    </nav>
  );
}

/** Mise en page de l'espace Pro : barre latérale (ordinateur) ou menu (mobile). */
export function ProShell({ companyName, logoDataUrl, children }: { companyName: string; logoDataUrl: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4ef] lg:flex-row dark:bg-[#0b1420]">
      {/* Mobile et tablette : barre du haut + menu déroulant */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#0b1420]/90">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand id="mobile" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="pro-mobile-nav"
            className="flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-sm font-semibold dark:border-white/20"
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            Menu
          </button>
        </div>
        {open && (
          <div id="pro-mobile-nav" className="border-t border-black/10 px-4 py-3 dark:border-white/10">
            <div className="mb-2 flex items-center gap-2 px-3">
              <ProLogo companyName={companyName} logoDataUrl={logoDataUrl} size={32} />
              <p className="truncate text-xs font-semibold text-black/50 dark:text-white/50">{companyName}</p>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
          </div>
        )}
      </div>

      {/* Ordinateur : barre latérale fixe */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-black/10 bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-white/[0.03]">
        <div className="px-2">
          <Brand id="sidebar" />
          <div className="mt-4 flex items-center gap-2.5">
            <ProLogo companyName={companyName} logoDataUrl={logoDataUrl} size={36} />
            <p className="min-w-0 truncate text-xs font-semibold text-black/60 dark:text-white/60" title={companyName}>
              {companyName}
            </p>
          </div>
        </div>
        <Nav />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
