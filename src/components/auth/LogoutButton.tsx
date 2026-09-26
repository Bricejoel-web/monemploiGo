"use client";

import { logout } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/config";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void logout(locale)}
      className="rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.08]"
    >
      {label}
    </button>
  );
}
