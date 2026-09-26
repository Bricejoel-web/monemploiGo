"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/lib/auth/actions";
import { CheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/home/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

// Cette carte de formulaire est toujours posée sur une photo assombrie
// (voir AuthLayout.tsx) : ses couleurs sont donc fixes (blanc/gris clair),
// jamais liées au thème clair/sombre du site.

function PasswordToggleButton({ shown, onToggle, dict }: { shown: boolean; onToggle: () => void; dict: Dictionary }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? dict.auth.hidePassword : dict.auth.showPassword}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
    >
      {shown ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
    </button>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 transition-colors ${met ? "text-emerald-400" : "text-white/40"}`}>
      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${met ? "border-emerald-400 bg-emerald-400" : "border-white/25"}`}>
        {met && <CheckIcon className="h-2 w-2 text-[#0b1420]" />}
      </span>
      {label}
    </li>
  );
}

export function SignupForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const signupWithLocale = signup.bind(null, locale);
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signupWithLocale, undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(reqs).every(Boolean);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
            {dict.auth.firstName}
          </label>
          <input id="firstName" name="firstName" required minLength={2} placeholder={dict.auth.firstNamePlaceholder} className="input-dark" />
          {state?.errors?.firstName && <p className="text-xs text-red-400">{state.errors.firstName[0]}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
            {dict.auth.lastName}
          </label>
          <input id="lastName" name="lastName" required minLength={2} placeholder={dict.auth.lastNamePlaceholder} className="input-dark" />
          {state?.errors?.lastName && <p className="text-xs text-red-400">{state.errors.lastName[0]}</p>}
        </div>
      </div>

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
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark pr-10"
          />
          <PasswordToggleButton shown={showPassword} onToggle={() => setShowPassword((v) => !v)} dict={dict} />
        </div>
        <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          <Requirement met={reqs.length} label={dict.auth.reqLength} />
          <Requirement met={reqs.upper} label={dict.auth.reqUppercase} />
          <Requirement met={reqs.lower} label={dict.auth.reqLowercase} />
          <Requirement met={reqs.digit} label={dict.auth.reqDigit} />
          <Requirement met={reqs.special} label={dict.auth.reqSpecial} />
        </ul>
        {state?.errors?.password?.map((err) => (
          <p key={err} className="text-xs text-red-400">
            {err}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {dict.auth.confirmPassword}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={dict.auth.confirmPasswordPlaceholder}
            className="input-dark pr-10"
            aria-invalid={mismatch}
          />
          <PasswordToggleButton shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} dict={dict} />
        </div>
        {mismatch && <p className="text-xs text-red-400">{dict.auth.passwordMismatch}</p>}
        {state?.errors?.confirmPassword && !mismatch && <p className="text-xs text-red-400">{state.errors.confirmPassword[0]}</p>}
      </div>

      <label className="flex items-start gap-2 text-xs text-white/70">
        <input type="checkbox" name="terms" required className="mt-0.5" />
        <span>
          {dict.auth.acceptTermsPrefix}{" "}
          <Link href={`/${locale}/conditions-utilisation`} target="_blank" className="font-medium text-[#f2994a] hover:underline">
            {dict.footer.termsOfUse}
          </Link>{" "}
          {dict.auth.acceptTermsConnector}{" "}
          <Link href={`/${locale}/confidentialite`} target="_blank" className="font-medium text-[#f2994a] hover:underline">
            {dict.footer.privacyPolicy}
          </Link>
          .
        </span>
      </label>
      {state?.errors?.terms && <p className="-mt-2 text-xs text-red-400">{state.errors.terms[0]}</p>}

      <label className="flex items-start gap-2 text-xs text-white/55">
        <input type="checkbox" name="marketingConsent" className="mt-0.5" />
        {dict.auth.marketingConsent}
      </label>

      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}

      <button
        type="submit"
        disabled={pending || mismatch || (password.length > 0 && !passwordValid)}
        className="btn-shine mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? dict.common.loading : dict.auth.submitSignup}
      </button>

      <p className="text-center text-sm text-white/60">
        {dict.auth.haveAccount}{" "}
        <Link href={`/${locale}/connexion`} className="font-medium text-[#f2994a] hover:underline">
          {dict.auth.goToLogin}
        </Link>
      </p>
    </form>
  );
}
