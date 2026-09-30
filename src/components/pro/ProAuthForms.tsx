"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createProSpace, loginPro, logoutPro, signupPro, type ProFormState } from "@/lib/pro/account-actions";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/home/icons";
import { NewPasswordFields } from "@/components/auth/NewPasswordFields";
import type { Dictionary } from "@/i18n/dictionaries";

// Formulaires de l'espace Pro (français uniquement), posés sur la carte
// sombre d'AuthLayout : couleurs fixes, comme les formulaires particuliers.

const labelClass = "text-xs font-semibold tracking-wide text-white/60 uppercase";
const linkClass = "font-medium text-[#f2994a] hover:underline";
const submitClass =
  "btn-shine mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100";

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  placeholder,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  errors?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input id={name} name={name} type={type} required autoComplete={autoComplete} defaultValue={defaultValue} placeholder={placeholder} className="input-dark" />
      {errors?.[0] && <p className="text-xs text-red-400">{errors[0]}</p>}
    </div>
  );
}

/** Champs communs : structure, responsable, e-mail professionnel, téléphone. */
function SpaceFields({ state, defaultEmail }: { state: ProFormState; defaultEmail?: string }) {
  return (
    <>
      <Field name="companyName" label="Nom de la structure *" autoComplete="organization" placeholder="Ex. Cabinet Horizon Carrières" errors={state?.errors?.companyName} />
      <Field name="managerName" label="Nom du responsable *" autoComplete="name" placeholder="Ex. Aline Ngo Mbarga" errors={state?.errors?.managerName} />
      <Field name="email" label="E-mail professionnel *" type="email" autoComplete="email" defaultValue={defaultEmail} placeholder="contact@votre-structure.cm" errors={state?.errors?.email} />
      <Field name="phone" label="Téléphone *" type="tel" autoComplete="tel" placeholder="Ex. +237 6 XX XX XX XX" errors={state?.errors?.phone} />
    </>
  );
}

function TermsCheckbox({ errors }: { errors?: string[] }) {
  return (
    <>
      <label className="flex items-start gap-2 text-xs text-white/70">
        <input type="checkbox" name="terms" required className="mt-0.5" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/fr/conditions-utilisation" target="_blank" className={linkClass}>
            Conditions générales d&apos;utilisation de MonEmploiGo
          </Link>{" "}
          et les{" "}
          <Link href="/fr/pro/conditions-utilisation" target="_blank" className={linkClass}>
            Conditions d&apos;utilisation de MonEmploiGo Pro
          </Link>
          .
        </span>
      </label>
      {errors?.[0] && <p className="-mt-2 text-xs text-red-400">{errors[0]}</p>}
    </>
  );
}

function Submit({ pending, disabled, label, dict }: { pending: boolean; disabled?: boolean; label: string; dict: Dictionary }) {
  return (
    <button type="submit" disabled={pending || disabled} className={submitClass}>
      {pending && <SpinnerIcon className="h-4 w-4" />}
      {pending ? dict.common.loading : label}
    </button>
  );
}

export function ProSignupForm({ dict }: { dict: Dictionary }) {
  const [state, action, pending] = useActionState<ProFormState, FormData>(signupPro, undefined);
  const [passwordValid, setPasswordValid] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <SpaceFields state={state} />
      {state?.existingAccount && (
        <p role="alert" className="-mt-2 rounded-xl border border-[#f2994a]/40 bg-[#f2994a]/10 p-3 text-xs text-white/85">
          Connectez-vous à ce compte : vous pourrez ensuite y créer votre espace professionnel, sans créer de second compte.{" "}
          <Link href="/fr/pro/connexion" className={linkClass}>
            Se connecter
          </Link>
        </p>
      )}
      <NewPasswordFields dict={dict} passwordLabel="Mot de passe *" errors={state?.errors} onValidityChange={setPasswordValid} />
      <TermsCheckbox errors={state?.errors?.terms} />
      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}
      <Submit pending={pending} disabled={!passwordValid} label="Créer mon espace professionnel" dict={dict} />
      <p className="text-center text-sm text-white/60">
        Vous avez déjà un compte ?{" "}
        <Link href="/fr/pro/connexion" className={linkClass}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function ProCreateSpaceForm({ dict, accountEmail }: { dict: Dictionary; accountEmail: string }) {
  const [state, action, pending] = useActionState<ProFormState, FormData>(createProSpace, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/75">
        Votre compte <strong className="text-white">{accountEmail}</strong> n&apos;a pas encore d&apos;espace professionnel. Il sera créé sur ce même compte,
        avec des données séparées de votre espace particulier.
      </p>
      <SpaceFields state={state} defaultEmail={accountEmail} />
      <TermsCheckbox errors={state?.errors?.terms} />
      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}
      <Submit pending={pending} label="Créer mon espace professionnel" dict={dict} />
      <p className="text-center text-xs text-white/50">
        Ce n&apos;est pas votre compte ?{" "}
        <button type="button" onClick={() => logoutPro()} className={linkClass}>
          Se déconnecter
        </button>
      </p>
    </form>
  );
}

export function ProLoginForm({ dict, notice }: { dict: Dictionary; notice?: "reset" | "suspended" }) {
  const [state, action, pending] = useActionState<ProFormState, FormData>(loginPro, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {notice === "reset" && (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {dict.passwordReset.resetDone}
        </p>
      )}
      {notice === "suspended" && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          Cet espace professionnel est suspendu. Contactez monemploigo.contact@gmail.com pour en savoir plus.
        </p>
      )}
      <Field name="email" label="E-mail" type="email" autoComplete="email" placeholder="contact@votre-structure.cm" errors={state?.errors?.email} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Mot de passe
        </label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" className="input-dark pr-10" />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
          >
            {showPassword ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
        <Link href="/fr/mot-de-passe-oublie?espace=pro" className={`self-end text-xs ${linkClass}`}>
          Mot de passe oublié ?
        </Link>
      </div>
      {state?.message && <p className="text-xs text-red-400">{state.message}</p>}
      <Submit pending={pending} label="Se connecter" dict={dict} />
      <p className="text-center text-sm text-white/60">
        Pas encore d&apos;espace professionnel ?{" "}
        <Link href="/fr/pro/inscription" className={linkClass}>
          Créer un espace professionnel
        </Link>
      </p>
    </form>
  );
}
