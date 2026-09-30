"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, resetPassword, type PasswordResetFormState } from "@/lib/auth/password-reset-actions";
import { SpinnerIcon } from "@/components/home/icons";
import { NewPasswordFields } from "./NewPasswordFields";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Space = "particulier" | "pro";

const submitClass =
  "btn-shine mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100";

function BackToLogin({ href, label }: { href: string; label: string }) {
  return (
    <p className="text-center text-sm">
      <Link href={href} className="font-medium text-[#f2994a] hover:underline">
        {label}
      </Link>
    </p>
  );
}

export function ForgotPasswordForm({ locale, space, dict, loginHref }: { locale: Locale; space: Space; dict: Dictionary; loginHref: string }) {
  const [state, action, pending] = useActionState<PasswordResetFormState, FormData>(requestPasswordReset.bind(null, locale, space), undefined);
  const t = dict.passwordReset;

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {t.requestSent}
        </p>
        <BackToLogin href={loginHref} label={t.backToLogin} />
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {dict.auth.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="input-dark" />
        {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
      </div>
      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}
      <button type="submit" disabled={pending} className={submitClass}>
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? dict.common.loading : t.submitRequest}
      </button>
      <BackToLogin href={loginHref} label={t.backToLogin} />
    </form>
  );
}

export function ResetPasswordForm({ locale, space, dict, token, forgotHref }: { locale: Locale; space: Space; dict: Dictionary; token: string; forgotHref: string }) {
  const [state, action, pending] = useActionState<PasswordResetFormState, FormData>(resetPassword.bind(null, locale, space), undefined);
  const [valid, setValid] = useState(false);
  const t = dict.passwordReset;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <NewPasswordFields dict={dict} passwordLabel={t.newPassword} errors={state?.errors} onValidityChange={setValid} />
      {state?.message && (
        <p role="alert" className="text-xs text-red-400">
          {state.message}{" "}
          <Link href={forgotHref} className="font-medium text-[#f2994a] hover:underline">
            {t.newRequest}
          </Link>
        </p>
      )}
      <button type="submit" disabled={pending || !valid} className={submitClass}>
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? dict.common.loading : t.submitReset}
      </button>
    </form>
  );
}
