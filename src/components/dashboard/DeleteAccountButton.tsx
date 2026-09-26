"use client";

import { useTransition } from "react";
import { deleteAccount } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function DeleteAccountButton({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(dict.dashboard.deleteAccountConfirm)) {
          startTransition(() => {
            void deleteAccount(locale);
          });
        }
      }}
      className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
    >
      {dict.dashboard.deleteAccount}
    </button>
  );
}
