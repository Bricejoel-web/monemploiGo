"use client";

import { useEffect, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { CoverLetterData, CoverLetterTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { CoverLetterRenderer } from "./CoverLetterRenderer";
import { EditorA4Preview } from "./EditorA4Preview";
import { Field } from "./FormField";
import { saveCoverLetterDocument } from "@/lib/documents/actions";
import { generateCoverLetterBodyAction, isAiGenerationAvailableAction } from "@/lib/documents/generate-actions";

function emptyData(): CoverLetterData {
  return {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    recipientName: "",
    recipientCompany: "",
    date: "",
    subject: "",
    body: "",
    jobTitle: "",
    sourceOfListing: "",
    yearsOfExperience: "",
    keySkills: "",
    motivationNotes: "",
  };
}

export function CoverLetterEditor({
  template,
  dict,
  locale,
  documentId,
  initialData,
}: {
  template: CoverLetterTemplateMeta;
  dict: Dictionary;
  locale: Locale;
  documentId?: string;
  initialData?: CoverLetterData;
}) {
  const [data, setData] = useState<CoverLetterData>(initialData ?? emptyData());
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => {
    void isAiGenerationAvailableAction().then(setAiAvailable);
  }, []);

  const update = <K extends keyof CoverLetterData>(key: K, value: CoverLetterData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = (mode: "rules" | "ai") => {
    setGenerating(true);
    startTransition(async () => {
      const result = await generateCoverLetterBodyAction(data, locale, mode);
      if (result.text) update("body", result.text);
      else if (result.error) setSaveError(result.error);
      setGenerating(false);
    });
  };

  const handleSubmit = () => {
    setSaveError(undefined);
    startTransition(async () => {
      try {
        let body = data.body.trim();
        if (!body) {
          // Filet de sécurité si l'utilisateur enregistre sans avoir cliqué
          // sur "Générer" : si cette génération de secours échoue (ex.
          // limite de débit atteinte), on doit arrêter et prévenir plutôt
          // que d'enregistrer silencieusement un document au corps vide.
          const generated = await generateCoverLetterBodyAction(data, locale, "rules");
          if (!generated.text) {
            setSaveError(generated.error ?? dict.editor.saveError);
            return;
          }
          body = generated.text;
        }
        await saveCoverLetterDocument(locale, template.slug, { ...data, body }, documentId);
      } catch (err) {
        unstable_rethrow(err);
        setSaveError(dict.editor.saveError);
      }
    });
  };

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-10 dark:bg-white/[0.05]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-[minmax(0,1fr)_480px]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.personalInfo}</h2>
          <Field id="cl-fullName" label={dict.editor.fullName}>
            <input id="cl-fullName" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className="input" />
          </Field>
          <Field id="cl-email" label={dict.editor.email}>
            <input id="cl-email" type="email" placeholder="vous@exemple.com" value={data.email} onChange={(e) => update("email", e.target.value)} className="input" />
          </Field>
          <Field id="cl-phone" label={dict.editor.phone}>
            <input id="cl-phone" type="tel" placeholder="+237 6XX XX XX XX" value={data.phone} onChange={(e) => update("phone", e.target.value)} className="input" />
          </Field>
          <Field id="cl-address" label={dict.editor.address} optionalLabel={dict.editor.optional}>
            <input id="cl-address" value={data.address} onChange={(e) => update("address", e.target.value)} className="input" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.recipient}</h2>
          <Field id="cl-recipientCompany" label={dict.editor.recipientCompany} optionalLabel={dict.editor.optional}>
            <input id="cl-recipientCompany" value={data.recipientCompany} onChange={(e) => update("recipientCompany", e.target.value)} className="input" />
          </Field>
          <Field id="cl-recipientName" label={dict.editor.recipientName} optionalLabel={dict.editor.optional}>
            <input id="cl-recipientName" value={data.recipientName} onChange={(e) => update("recipientName", e.target.value)} className="input" />
          </Field>
          <Field id="cl-date" label={dict.editor.dateAndPlace}>
            <input id="cl-date" placeholder="Douala, le 21 septembre 2026" value={data.date} onChange={(e) => update("date", e.target.value)} className="input" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.jobDetails}</h2>
          <Field id="cl-jobTitle" label={dict.editor.jobTitle}>
            <input id="cl-jobTitle" value={data.jobTitle ?? ""} onChange={(e) => update("jobTitle", e.target.value)} className="input" />
          </Field>
          <Field id="cl-sourceOfListing" label={dict.editor.sourceOfListing} optionalLabel={dict.editor.optional}>
            <input id="cl-sourceOfListing" value={data.sourceOfListing ?? ""} onChange={(e) => update("sourceOfListing", e.target.value)} className="input" />
          </Field>
          <Field id="cl-yearsOfExperience" label={dict.editor.yearsOfExperience} optionalLabel={dict.editor.optional}>
            <input id="cl-yearsOfExperience" placeholder="3 ans" value={data.yearsOfExperience ?? ""} onChange={(e) => update("yearsOfExperience", e.target.value)} className="input" />
          </Field>
          <Field id="cl-keySkills" label={dict.editor.keySkills} optionalLabel={dict.editor.optional}>
            <input id="cl-keySkills" placeholder="Gestion de projet, Excel, ..." value={data.keySkills ?? ""} onChange={(e) => update("keySkills", e.target.value)} className="input" />
          </Field>
          <Field id="cl-motivationNotes" label={dict.editor.bbMotivationNotes} optionalLabel={dict.editor.optional}>
            <textarea id="cl-motivationNotes" value={data.motivationNotes ?? ""} onChange={(e) => update("motivationNotes", e.target.value)} className="input min-h-16" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.message}</h2>
          <Field id="cl-subject" label={dict.editor.subject}>
            <input id="cl-subject" value={data.subject} onChange={(e) => update("subject", e.target.value)} className="input" />
          </Field>
          <p className="-mt-1 text-xs text-black/50 dark:text-white/50">{dict.editor.bbBodyHint}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerate("rules")}
              className="btn-shine rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
            >
              {generating ? dict.common.loading : dict.editor.bbGenerate}
            </button>
            {aiAvailable && (
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate("ai")}
                className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold text-black/70 transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
              >
                {dict.editor.bbRegenerateAi}
              </button>
            )}
          </div>
          <Field id="cl-body" label={dict.editor.body}>
            <textarea id="cl-body" value={data.body} onChange={(e) => update("body", e.target.value)} className="input min-h-64" />
          </Field>
          <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{dict.editor.bodyHint}</p>
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">
              {dict.editor.price}: <strong>{template.priceFcfa} FCFA</strong>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="btn-shine rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
            >
              {pending ? dict.common.loading : dict.editor.saveAndPay}
            </button>
          </div>
          {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
          <p className="text-xs text-black/50 dark:text-white/50">{dict.retention.editorDraftHint}</p>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <EditorA4Preview
          pageFitsLabel={dict.editor.pageCountFits}
          pageOverflowLabel={dict.editor.pageCountOverflow}
          pageOverflowHint={dict.editor.pageCountHint}
        >
          <CoverLetterRenderer data={data} layout={template.layout} theme={template.theme} locale={locale} />
        </EditorA4Preview>
      </div>
      </div>
    </div>
  );
}
