"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * `referralAvailable` : gains de parrainage disponibles, non retirés. La
 * confirmation prévient qu'ils pourront être perdus. Le refus en cas de
 * retrait en attente est décidé par le serveur (deleteAccount).
 */
export function DeleteAccountButton({ locale, dict, referralAvailable = 0 }: { locale: Locale; dict: Dictionary; referralAvailable?: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirmText =
    referralAvailable > 0
      ? `${dict.dashboard.deleteReferralWarning.replace("{amount}", String(referralAvailable))}\n\n${dict.dashboard.deleteAccountConfirm}`
      : dict.dashboard.deleteAccountConfirm;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(confirmText)) {
            setError(undefined);
            startTransition(async () => {
              const result = await deleteAccount(locale);
              if (result?.error) setError(result.error);
            });
          }
        }}
        className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
      >
        {dict.dashboard.deleteAccount}
      </button>
      {error && (
        <p role="alert" className="max-w-md text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
