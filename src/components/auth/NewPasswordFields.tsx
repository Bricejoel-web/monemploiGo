"use client";

import { useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon } from "@/components/home/icons";
import type { Dictionary } from "@/i18n/dictionaries";

// Mêmes règles et même affichage en direct que l'inscription particulier
// (SignupForm.tsx) ; la règle fait foi côté serveur (password-rules.ts).
// Cartes posées sur une photo assombrie (AuthLayout) : couleurs fixes.

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

function PasswordInput({
  id,
  value,
  onChange,
  shown,
  onToggle,
  dict,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
  dict: Dictionary;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={shown ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid}
        className="input-dark pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={shown ? dict.auth.hidePassword : dict.auth.showPassword}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
      >
        {shown ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

/** Mot de passe + confirmation, avec la liste des règles en direct. */
export function NewPasswordFields({
  dict,
  passwordLabel,
  errors,
  onValidityChange,
}: {
  dict: Dictionary;
  passwordLabel?: string;
  errors?: { password?: string[]; confirmPassword?: string[] };
  /** Vrai quand le mot de passe respecte les règles et que la confirmation correspond. */
  onValidityChange?: (valid: boolean) => void;
}) {
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

  const update = (nextPassword: string, nextConfirm: string) => {
    setPassword(nextPassword);
    setConfirmPassword(nextConfirm);
    const rulesOk =
      nextPassword.length >= 8 && /[A-Z]/.test(nextPassword) && /[a-z]/.test(nextPassword) && /[0-9]/.test(nextPassword) && /[^A-Za-z0-9]/.test(nextPassword);
    onValidityChange?.(rulesOk && nextPassword === nextConfirm);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {passwordLabel ?? dict.auth.password}
        </label>
        <PasswordInput id="password" value={password} onChange={(v) => update(v, confirmPassword)} shown={showPassword} onToggle={() => setShowPassword((v) => !v)} dict={dict} />
        <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          <Requirement met={reqs.length} label={dict.auth.reqLength} />
          <Requirement met={reqs.upper} label={dict.auth.reqUppercase} />
          <Requirement met={reqs.lower} label={dict.auth.reqLowercase} />
          <Requirement met={reqs.digit} label={dict.auth.reqDigit} />
          <Requirement met={reqs.special} label={dict.auth.reqSpecial} />
        </ul>
        {errors?.password?.map((err) => (
          <p key={err} className="text-xs text-red-400">
            {err}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          {dict.auth.confirmPassword}
        </label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(v) => update(password, v)}
          shown={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          dict={dict}
          placeholder={dict.auth.confirmPasswordPlaceholder}
          invalid={mismatch}
        />
        {mismatch && <p className="text-xs text-red-400">{dict.auth.passwordMismatch}</p>}
        {errors?.confirmPassword && !mismatch && <p className="text-xs text-red-400">{errors.confirmPassword[0]}</p>}
      </div>
    </>
  );
}
