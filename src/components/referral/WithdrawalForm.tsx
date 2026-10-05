"use client";

import { useActionState } from "react";
import { SpinnerIcon } from "@/components/home/icons";
import { requestWithdrawal, type WithdrawalFormState } from "@/lib/referral/actions";

const inputClass = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm dark:border-white/20 dark:bg-white/5";

export function WithdrawalForm({ available, minimum }: { available: number; minimum: number }) {
  const [state, action, pending] = useActionState<WithdrawalFormState, FormData>(requestWithdrawal, undefined);
  const disabled = available < minimum;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium">
            Montant du retrait (FCFA)
          </label>
          <input id="amount" name="amount" type="number" inputMode="numeric" min={minimum} max={available || undefined} step={1} required disabled={disabled} className={inputClass} />
          {state?.errors?.amount && <p className="text-xs text-red-600">{state.errors.amount[0]}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="method" className="text-sm font-medium">
            Paiement sur
          </label>
          <select id="method" name="method" required disabled={disabled} className={inputClass} defaultValue="">
            <option value="" disabled>
              Choisir
            </option>
            <option value="MTN_MOMO">MTN Mobile Money</option>
            <option value="ORANGE_MONEY">Orange Money</option>
          </select>
          {state?.errors?.method && <p className="text-xs text-red-600">{state.errors.method[0]}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Numéro Mobile Money
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="6XX XX XX XX" required disabled={disabled} className={inputClass} />
          {state?.errors?.phone && <p className="text-xs text-red-600">{state.errors.phone[0]}</p>}
        </div>
      </div>
      {state?.message && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={pending || disabled}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 disabled:opacity-50"
        >
          {pending && <SpinnerIcon className="h-4 w-4" />}
          Demander le paiement
        </button>
        {disabled && <p className="mt-2 text-xs text-black/55 dark:text-white/55">Disponible dès {minimum} FCFA de solde.</p>}
      </div>
    </form>
  );
}
