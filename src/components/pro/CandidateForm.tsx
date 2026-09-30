"use client";

import { useActionState, useState } from "react";
import { SpinnerIcon } from "@/components/home/icons";
import type { CandidateFormState } from "@/lib/pro/candidate-actions";
import { APPLICATION_TYPES, COUNTRY_SUGGESTIONS, EDUCATION_LEVELS, GERMAN_LEVELS, germanLevelRelevant } from "@/lib/pro/candidate-options";

export type CandidateValues = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "destinationCountry" | "professionalField" | "applicationType" | "educationLevel" | "languages" | "germanLevel", string | null>
>;

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2994a] focus:ring-2 focus:ring-[#f2994a]/25 dark:border-white/20 dark:bg-white/5";

function Field({ name, label, error, children }: { name: string; label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{error[0]}</p>}
    </div>
  );
}

/** Formulaire du dossier candidat (création, et modification en phase 4). */
export function CandidateForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: CandidateFormState, formData: FormData) => Promise<CandidateFormState>;
  defaults?: CandidateValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<CandidateFormState, FormData>(action, undefined);
  const [country, setCountry] = useState(defaults.destinationCountry ?? "");
  const [type, setType] = useState(defaults.applicationType ?? "");
  const showGerman = germanLevelRelevant(country, type);
  const e = state?.errors;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <legend className="px-1 text-base font-semibold">Identité</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="firstName" label="Prénom *" error={e?.firstName}>
            <input id="firstName" name="firstName" required maxLength={80} defaultValue={defaults.firstName ?? ""} autoComplete="off" className={inputClass} />
          </Field>
          <Field name="lastName" label="Nom *" error={e?.lastName}>
            <input id="lastName" name="lastName" required maxLength={80} defaultValue={defaults.lastName ?? ""} autoComplete="off" className={inputClass} />
          </Field>
          <Field name="email" label="Email" error={e?.email}>
            <input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} autoComplete="off" className={inputClass} />
          </Field>
          <Field name="phone" label="Téléphone" error={e?.phone}>
            <input id="phone" name="phone" type="tel" defaultValue={defaults.phone ?? ""} autoComplete="off" placeholder="Ex. +237 6 XX XX XX XX" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <legend className="px-1 text-base font-semibold">Candidature</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="destinationCountry" label="Pays de destination" error={e?.destinationCountry}>
            <input
              id="destinationCountry"
              name="destinationCountry"
              list="country-suggestions"
              maxLength={80}
              value={country}
              onChange={(ev) => setCountry(ev.target.value)}
              autoComplete="off"
              className={inputClass}
            />
            <datalist id="country-suggestions">
              {COUNTRY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field name="professionalField" label="Domaine professionnel" error={e?.professionalField}>
            <input id="professionalField" name="professionalField" maxLength={120} defaultValue={defaults.professionalField ?? ""} placeholder="Ex. Soins infirmiers (Pflege)" className={inputClass} />
          </Field>
          <Field name="applicationType" label="Type de candidature" error={e?.applicationType}>
            <select id="applicationType" name="applicationType" value={type} onChange={(ev) => setType(ev.target.value)} className={inputClass}>
              <option value="">— Non précisé —</option>
              {APPLICATION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field name="educationLevel" label="Niveau d'études" error={e?.educationLevel}>
            <select id="educationLevel" name="educationLevel" defaultValue={defaults.educationLevel ?? ""} className={inputClass}>
              <option value="">— Non précisé —</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field name="languages" label="Langues" error={e?.languages}>
            <input id="languages" name="languages" maxLength={200} defaultValue={defaults.languages ?? ""} placeholder="Ex. Français, Anglais" className={inputClass} />
          </Field>
          {showGerman && (
            <Field name="germanLevel" label="Niveau d'allemand" error={e?.germanLevel}>
              <select id="germanLevel" name="germanLevel" defaultValue={defaults.germanLevel ?? ""} className={inputClass}>
                <option value="">— Non précisé —</option>
                {GERMAN_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </fieldset>

      {state?.message && (
        <p role="alert" className="rounded-xl border border-red-300/70 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200">
          {state.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition hover:opacity-95 disabled:opacity-60"
        >
          {pending && <SpinnerIcon className="h-4 w-4" />}
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
