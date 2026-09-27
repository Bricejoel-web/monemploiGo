"use client";

import { useEffect, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { BewerbungsbriefData, BewerbungsbriefTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { BewerbungsbriefRenderer } from "./BewerbungsbriefRenderer";
import { EditorA4Preview } from "./EditorA4Preview";
import { Field } from "./FormField";
import { saveBewerbungsbriefDocument } from "@/lib/documents/actions";
import { generateBewerbungsbriefBodyAction, isAiGenerationAvailableAction } from "@/lib/documents/generate-actions";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const SOURCE_OPTIONS = ["Stellenanzeige (Website)", "Agentur für Arbeit", "Ausbildungsmesse", "Empfehlung"];

// Pièces jointes usuelles d'une candidature Ausbildung/Pflege — les termes
// restent en allemand quelle que soit la langue du site, comme pour les
// intitulés des CV Allemagne (voir docs/ROADMAP.md).
const ATTACHMENT_OPTIONS = ["Lebenslauf", "Zeugnisse", "Sprachzertifikat", "Führungszeugnis", "Praktikumsnachweise"];

// Même principe que dans CvEditor.tsx : un vrai calendrier (jour inclus)
// pour une expérience de sélection confortable, alors que seule la date
// d'obtention (MM/AAAA) est réellement affichée sur la lettre.
function monthYearToIsoDate(display: string): string {
  const [m, y] = display.split("/");
  if (!m || !y) return "";
  return `${y}-${m}-01`;
}
function isoDateToMonthYear(iso: string): string {
  const [y, m] = iso.split("-");
  if (!y || !m) return "";
  return `${m}/${y}`;
}

function emptyData(): BewerbungsbriefData {
  return {
    fullName: "",
    address: "",
    phone: "",
    email: "",
    recipientInstitution: "",
    recipientAddress: "",
    recipientContactName: "",
    city: "",
    date: new Date().toLocaleDateString("de-DE"),
    targetProgram: "",
    referenceNumber: "",
    sourceOfListing: "",
    qualifications: [{ title: "", institution: "", date: "" }],
    languageLevel: "",
    motivationNotes: "",
    availabilityDate: "",
    attachments: [],
    body: "",
  };
}

export function BewerbungsbriefEditor({
  template,
  dict,
  locale,
  documentId,
  initialData,
}: {
  template: BewerbungsbriefTemplateMeta;
  dict: Dictionary;
  locale: Locale;
  documentId?: string;
  initialData?: BewerbungsbriefData;
}) {
  const [data, setData] = useState<BewerbungsbriefData>(initialData ?? emptyData());
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [availableNow, setAvailableNow] = useState(() => !data.availabilityDate);
  const [dayOverrides, setDayOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    void isAiGenerationAvailableAction().then(setAiAvailable);
  }, []);

  const update = <K extends keyof BewerbungsbriefData>(key: K, value: BewerbungsbriefData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const monthYearInputValue = (key: string, monthYear: string) => dayOverrides[key] ?? monthYearToIsoDate(monthYear);
  const handleMonthYearChange = (key: string, iso: string, onChange: (monthYear: string) => void) => {
    setDayOverrides((prev) => ({ ...prev, [key]: iso }));
    onChange(isoDateToMonthYear(iso));
  };

  const toggleAttachment = (item: string) =>
    update("attachments", data.attachments.includes(item) ? data.attachments.filter((a) => a !== item) : [...data.attachments, item]);

  const handleGenerate = (mode: "rules" | "ai") => {
    setGenerating(true);
    startTransition(async () => {
      const result = await generateBewerbungsbriefBodyAction(data, mode);
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
          const generated = await generateBewerbungsbriefBodyAction(data, "rules");
          if (!generated.text) {
            setSaveError(generated.error ?? dict.editor.saveError);
            return;
          }
          body = generated.text;
        }
        await saveBewerbungsbriefDocument(locale, template.slug, { ...data, body }, documentId);
      } catch (err) {
        unstable_rethrow(err);
        setSaveError(dict.editor.saveError);
      }
    });
  };

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-10 dark:bg-white/[0.05]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.personalInfo}</h2>
          <Field id="bb-fullName" label={dict.editor.fullName}>
            <input id="bb-fullName" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className="input" />
          </Field>
          <Field id="bb-address" label={dict.editor.address}>
            <input id="bb-address" value={data.address} onChange={(e) => update("address", e.target.value)} className="input" />
          </Field>
          <Field id="bb-phone" label={dict.editor.phone}>
            <input id="bb-phone" type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} className="input" />
          </Field>
          <Field id="bb-email" label={dict.editor.email}>
            <input id="bb-email" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} className="input" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.bbTargetTitle}</h2>
          <Field id="bb-recipientInstitution" label={dict.editor.recipientCompany}>
            <input id="bb-recipientInstitution" value={data.recipientInstitution} onChange={(e) => update("recipientInstitution", e.target.value)} className="input" />
          </Field>
          <Field id="bb-recipientAddress" label={dict.editor.bbRecipientAddress} optionalLabel={dict.editor.optional}>
            <input id="bb-recipientAddress" value={data.recipientAddress ?? ""} onChange={(e) => update("recipientAddress", e.target.value)} className="input" />
          </Field>
          <Field id="bb-recipientContactName" label={dict.editor.recipientName} optionalLabel={dict.editor.optional}>
            <input id="bb-recipientContactName" value={data.recipientContactName ?? ""} onChange={(e) => update("recipientContactName", e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field id="bb-city" label={dict.editor.bbCity}>
              <input id="bb-city" value={data.city} onChange={(e) => update("city", e.target.value)} className="input" />
            </Field>
            <Field id="bb-date" label={dict.editor.bbLetterDate}>
              <input id="bb-date" value={data.date} onChange={(e) => update("date", e.target.value)} className="input" />
            </Field>
          </div>
          <Field id="bb-targetProgram" label={dict.editor.bbTargetProgram}>
            <input id="bb-targetProgram" placeholder="Ausbildung zur Pflegefachfrau" value={data.targetProgram} onChange={(e) => update("targetProgram", e.target.value)} className="input" />
          </Field>
          <Field id="bb-referenceNumber" label={dict.editor.bbReferenceNumber} optionalLabel={dict.editor.optional}>
            <input id="bb-referenceNumber" value={data.referenceNumber ?? ""} onChange={(e) => update("referenceNumber", e.target.value)} className="input" />
          </Field>
          <Field id="bb-sourceOfListing" label={dict.editor.bbSourceOfListing} optionalLabel={dict.editor.optional}>
            <select id="bb-sourceOfListing" value={data.sourceOfListing ?? ""} onChange={(e) => update("sourceOfListing", e.target.value)} className="input">
              <option value=""></option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.bbQualifications}</h2>
          {data.qualifications.map((q, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-black/10 bg-background/50 p-4 dark:border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <Field id={`bb-qual-title-${i}`} label={dict.editor.bbQualificationTitle}>
                  <input
                    id={`bb-qual-title-${i}`}
                    value={q.title}
                    onChange={(e) => update("qualifications", data.qualifications.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    className="input"
                  />
                </Field>
                <Field id={`bb-qual-institution-${i}`} label={dict.editor.bbQualificationInstitution}>
                  <input
                    id={`bb-qual-institution-${i}`}
                    value={q.institution}
                    onChange={(e) => update("qualifications", data.qualifications.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x)))}
                    className="input"
                  />
                </Field>
                <Field id={`bb-qual-date-${i}`} label={dict.editor.bbQualificationDate}>
                  <input
                    id={`bb-qual-date-${i}`}
                    type="date"
                    value={monthYearInputValue(`bb-qual-date-${i}`, q.date)}
                    onChange={(e) =>
                      handleMonthYearChange(`bb-qual-date-${i}`, e.target.value, (monthYear) =>
                        update("qualifications", data.qualifications.map((x, j) => (j === i ? { ...x, date: monthYear } : x))),
                      )
                    }
                    className="input"
                  />
                </Field>
              </div>
              <button type="button" onClick={() => update("qualifications", data.qualifications.filter((_, j) => j !== i))} className="self-start text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400">
                {dict.editor.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("qualifications", [...data.qualifications, { title: "", institution: "", date: "" }])}
            className="self-start rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          >
            + {dict.editor.bbAddQualification}
          </button>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.languages}</h2>
          <Field id="bb-languageLevel" label={dict.editor.level}>
            <select id="bb-languageLevel" value={data.languageLevel} onChange={(e) => update("languageLevel", e.target.value)} className="input">
              <option value="" disabled>
                {dict.editor.selectLevel}
              </option>
              {CEFR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.bbAvailability}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={availableNow}
              onChange={(e) => {
                setAvailableNow(e.target.checked);
                if (e.target.checked) update("availabilityDate", "");
              }}
            />
            {dict.editor.bbAvailableNow}
          </label>
          {!availableNow && (
            <Field id="bb-availabilityDate" label={dict.editor.bbAvailability}>
              <input
                id="bb-availabilityDate"
                type="date"
                value={monthYearInputValue("bb-availabilityDate", data.availabilityDate ?? "")}
                onChange={(e) =>
                  handleMonthYearChange("bb-availabilityDate", e.target.value, (monthYear) => update("availabilityDate", monthYear))
                }
                className="input"
              />
            </Field>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.attachments}</h2>
          <div className="flex flex-wrap gap-3">
            {ATTACHMENT_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.attachments.includes(item)} onChange={() => toggleAttachment(item)} />
                {item}
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.bbMotivationNotes}</h2>
          <p className="-mt-1 text-xs text-black/50 dark:text-white/50">{dict.editor.bbMotivationNotesHint}</p>
          <Field id="bb-motivationNotes" label={dict.editor.bbMotivationNotes} optionalLabel={dict.editor.optional}>
            <textarea id="bb-motivationNotes" value={data.motivationNotes ?? ""} onChange={(e) => update("motivationNotes", e.target.value)} className="input min-h-16" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.body}</h2>
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
          <Field id="bb-body" label={dict.editor.body}>
            <textarea id="bb-body" value={data.body} onChange={(e) => update("body", e.target.value)} className="input min-h-64" />
          </Field>
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
          <BewerbungsbriefRenderer data={data} layoutId={template.layoutId} theme={template.theme} locale={locale} />
        </EditorA4Preview>
      </div>
      </div>
    </div>
  );
}
