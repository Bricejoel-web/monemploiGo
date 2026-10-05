"use client";

import { useActionState } from "react";
import { updateProSettings, type ProSettingsState } from "@/lib/pro/settings-actions";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2994a] focus:ring-2 focus:ring-[#f2994a]/25 dark:border-white/20 dark:bg-white/5";

type Values = { companyName: string; managerName: string; email: string; phone: string };

const FIELDS: { name: keyof Values; label: string; type: string; autoComplete: string }[] = [
  { name: "companyName", label: "Nom de la structure", type: "text", autoComplete: "organization" },
  { name: "managerName", label: "Nom du responsable", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail professionnel", type: "email", autoComplete: "email" },
  { name: "phone", label: "Téléphone", type: "tel", autoComplete: "tel" },
];

/** Informations de la structure, revérifiées côté serveur (updateProSettings). */
export function ProSettingsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState<ProSettingsState, FormData>(updateProSettings, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </label>
            <input id={field.name} name={field.name} type={field.type} required autoComplete={field.autoComplete} defaultValue={values[field.name]} className={inputClass} />
            {state?.errors?.[field.name]?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{state.errors[field.name]![0]}</p>}
          </div>
        ))}
      </div>
      <p className="text-xs text-black/55 dark:text-white/55">L&apos;e-mail professionnel reçoit les avertissements liés à votre abonnement.</p>
      {state?.message && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          Modifications enregistrées.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-[#16324f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f4470] disabled:opacity-60 dark:bg-white dark:text-[#16324f]"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
