"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/lib/auth/actions";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/home/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function LoginForm({ locale, dict, passwordJustReset = false, next }: { locale: Locale; dict: Dictionary; passwordJustReset?: boolean; next?: string }) {
  const loginWithLocale = login.bind(null, locale);
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginWithLocale, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Page où revenir après la connexion (revérifiée côté serveur). */}
      {next && <input type="hidden" name="suivant" value={next} />}
      {passwordJustReset && (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {dict.passwordReset.resetDone}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {dict.auth.email}
        </label>
        <input id="email" name="email" type="email" required placeholder="vous@exemple.com" className="input-dark" />
        {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {dict.auth.password}
        </label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? "text" : "password"} required className="input-dark pr-10" />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
          >
            {showPassword ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
        <Link href={`/${locale}/mot-de-passe-oublie`} className="self-end text-xs font-medium text-[#f2994a] hover:underline">
          {dict.passwordReset.forgotLink}
        </Link>
      </div>

      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn-shine mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? dict.common.loading : dict.auth.submitLogin}
      </button>

      <p className="text-center text-sm text-white/60">
        {dict.auth.noAccount}{" "}
        <Link href={`/${locale}/inscription`} className="font-medium text-[#f2994a] hover:underline">
          {dict.auth.goToSignup}
        </Link>
      </p>
    </form>
  );
}
