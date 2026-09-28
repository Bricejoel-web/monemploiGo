"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { CvData, CvTemplateMeta } from "@/lib/cv/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { CvRenderer } from "./CvRenderer";
import { EditorA4Preview } from "./EditorA4Preview";
import { PhotoPicker } from "./PhotoPicker";
import { Field } from "./FormField";
import { saveCvDocument } from "@/lib/documents/actions";

// Niveau de langue en menu déroulant plutôt qu'en texte libre, pour un choix
// plus rapide et cohérent d'un CV à l'autre. Le CV allemand utilise l'échelle
// CECR (A1 à C1) pour sa première langue — c'est l'échelle officiellement
// utilisée pour les certificats d'allemand (telc, Goethe-Institut) exigés
// par les établissements de formation Ausbildung/Pflege. Les langues
// ajoutées ensuite utilisent l'échelle générale, plus simple, qui reste
// l'échelle par défaut pour toutes les autres catégories de CV.
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const GENERAL_LEVELS = (dict: Dictionary) => [
  dict.editor.levelBeginner,
  dict.editor.levelIntermediate,
  dict.editor.levelExpert,
  dict.editor.levelNative,
];
// Sur un CV allemand, tout le document est en allemand quelle que soit la
// langue de l'interface du site (comme les intitulés de section "Persönliche
// Daten", "Berufserfahrung"...) : ces niveaux, imprimés tels quels sur le
// CV, doivent donc toujours être en allemand eux aussi, plutôt que de
// dépendre de la langue de l'interface (signalé par l'utilisateur : les
// propositions apparaissaient en français sur un CV allemand).
const GERMAN_GENERAL_LEVELS = ["Grundkenntnisse", "Gute Kenntnisse", "Fließend", "Muttersprache"];

// La date de naissance est saisie via un vrai calendrier (input type="date",
// qui stocke une date au format ISO AAAA-MM-JJ) pour éviter à l'utilisateur
// de taper le format à la main. Le CV, lui, continue d'afficher la date au
// format allemand JJ.MM.AAAA (convention du Lebenslauf) : on convertit donc
// entre les deux formats juste à l'affichage/à la saisie.
function isoToGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
}

function germanDateToIso(de: string): string {
  const [d, m, y] = de.split(".");
  if (!d || !m || !y) return "";
  return `${y}-${m}-${d}`;
}

// Dates de début/fin d'expérience et de formation : même principe, avec un
// vrai calendrier complet (input type="date", jour inclus) plutôt que le
// sélecteur "mois/année" natif du navigateur — dont l'interface minimale
// (simples flèches haut/bas, sans grille de jours) a été jugée peu
// professionnelle et malcommode. Le CV, lui, continue de n'afficher que le
// mois et l'année (le jour exact d'une prise de poste n'a pas sa place sur
// un CV) : le jour choisi sert uniquement à naviguer dans un calendrier
// familier, il est ignoré à l'enregistrement.
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

const PRESENT_VALUES = ["présent", "present", "heute"];
function isPresent(value: string): boolean {
  return PRESENT_VALUES.includes(value.trim().toLowerCase());
}
function presentLabel(locale: Locale, isGerman: boolean): string {
  if (isGerman) return "heute";
  return locale === "en" ? "Present" : "présent";
}

function emptyCvData(): CvData {
  return {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    photoDataUrl: null,
    experience: [{ role: "", company: "", location: "", start: "", end: "", description: "" }],
    education: [{ degree: "", school: "", location: "", start: "", end: "", description: "" }],
    skills: [],
    languages: [{ name: "", level: "" }],
  };
}

export function CvEditor({
  template,
  dict,
  locale,
  documentId,
  initialData,
  initialIncludePhoto = false,
}: {
  template: CvTemplateMeta;
  dict: Dictionary;
  locale: Locale;
  documentId?: string;
  initialData?: CvData;
  initialIncludePhoto?: boolean;
}) {
  const [data, setData] = useState<CvData>(initialData ?? emptyCvData());
  const [skillsInput, setSkillsInput] = useState(initialData?.skills.join(", ") ?? "");
  const [includePhoto, setIncludePhoto] = useState(initialIncludePhoto);
  const [noExperience, setNoExperience] = useState(() => Boolean(initialData) && initialData!.experience.length === 0);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | undefined>();
  const isGerman = template.category === "GERMAN_ATS";

  const update = <K extends keyof CvData>(key: K, value: CvData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  // Le CV n'affiche que mois/année (start/end sont stockés en "MM/AAAA"), donc
  // reconstruire la valeur ISO du calendrier à partir de data renvoie toujours
  // le jour "01" : sans mémoire à part, le calendrier "revenait" au 1er du mois
  // juste après avoir cliqué un autre jour. On garde donc le jour choisi dans
  // un état local, purement pour l'affichage du sélecteur — il n'est jamais
  // envoyé au CV ni enregistré.
  const [dayOverrides, setDayOverrides] = useState<Record<string, string>>({});
  const monthYearInputValue = (key: string, monthYear: string) => dayOverrides[key] ?? monthYearToIsoDate(monthYear);
  const handleMonthYearChange = (key: string, iso: string, onChange: (monthYear: string) => void) => {
    setDayOverrides((prev) => ({ ...prev, [key]: iso }));
    onChange(isoDateToMonthYear(iso));
  };

  // Une photo de téléphone non compressée (souvent plusieurs Mo une fois
  // encodée en base64) dépassait la limite de taille des Server Actions et
  // faisait échouer l'enregistrement sans aucun message ("rien ne se passe"
  // au clic sur Enregistrer et payer). On redimensionne donc et recompresse
  // la photo côté client avant de la stocker — largement suffisant pour une
  // photo de CV, et qui tient toujours sous la limite.
  // Une photo présente est une photo affichée : choisir une photo l'ajoute au
  // CV, la retirer l'enlève (plus de case "Inclure ma photo" séparée, que les
  // utilisateurs ne remarquaient pas — voir PhotoPicker).
  const [photoError, setPhotoError] = useState<string | null>(null);
  const setPhoto = (dataUrl: string) => {
    update("photoDataUrl", dataUrl);
    setIncludePhoto(true);
    setPhotoError(null);
  };
  const removePhoto = () => {
    update("photoDataUrl", null);
    setIncludePhoto(false);
    setPhotoError(null);
  };
  const handlePhotoChange = (file: File) => {
    // Sans ce message, un format que le navigateur ne sait pas décoder (HEIC
    // de certains téléphones, fichier qui n'est pas une image) ne produisait
    // strictement aucun effet.
    const fail = () => setPhotoError(dict.editor.photoError);
    if (!file.type.startsWith("image/")) return fail();
    const reader = new FileReader();
    reader.onerror = fail;
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = fail;
      img.onload = () => {
        const maxDim = 500;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return setPhoto(reader.result as string);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    setSaveError(undefined);
    const finalData: CvData = {
      ...data,
      experience: noExperience ? [] : data.experience,
      skills: skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      try {
        await saveCvDocument(locale, template.slug, finalData, includePhoto, documentId);
      } catch (err) {
        // saveCvDocument redirige en cas de succès (via redirect(), qui lève une
        // erreur interne spéciale) : on la relance pour laisser Next.js gérer la
        // navigation, et on n'affiche un message que pour une vraie erreur —
        // pour que l'utilisateur ne voit plus jamais "rien ne se passe" au clic.
        unstable_rethrow(err);
        setSaveError(dict.editor.saveError);
      }
    });
  };

  return (
    <div className="bg-dot-grid relative bg-[#efe6d8] py-10 dark:bg-white/[0.05]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-[minmax(0,1fr)_480px]">
      <div className="flex flex-col gap-6">
        {(template.category === "ATS" || isGerman) && (
          <p className="rounded-2xl border border-sky-300/60 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100">
            {dict.atsGuide.editorTip}
          </p>
        )}
        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.personalInfo}</h2>
          <Field id="fullName" label={dict.editor.fullName}>
            <input id="fullName" placeholder="Jean Dupont" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className="input" />
          </Field>
          <Field id="jobTitle" label={dict.editor.jobTitle}>
            <input id="jobTitle" value={data.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} className="input" />
          </Field>
          <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{dict.editor.targetRoleHint}</p>
          <Field id="email" label={dict.editor.email}>
            <input id="email" type="email" placeholder="vous@exemple.com" value={data.email} onChange={(e) => update("email", e.target.value)} className="input" />
          </Field>
          <Field id="phone" label={dict.editor.phone}>
            <input id="phone" type="tel" placeholder="+237 6XX XX XX XX" value={data.phone} onChange={(e) => update("phone", e.target.value)} className="input" />
          </Field>
          <Field id="address" label={dict.editor.address} optionalLabel={dict.editor.optional}>
            <input id="address" value={data.address} onChange={(e) => update("address", e.target.value)} className="input" />
          </Field>
          <Field id="summary" label={dict.editor.summary} optionalLabel={dict.editor.optional}>
            <textarea id="summary" value={data.summary} onChange={(e) => update("summary", e.target.value)} className="input min-h-20" />
          </Field>
        </section>

        {isGerman && (
          <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
            <h2 className="text-base font-semibold tracking-tight">{dict.editor.germanPersonalData}</h2>
            <p className="-mt-1 text-xs text-black/50 dark:text-white/50">{dict.editor.germanPersonalDataHint}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Field id="birthDate" label={dict.editor.birthDate} optionalLabel={dict.editor.optional}>
                <input
                  id="birthDate"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={germanDateToIso(data.birthDate ?? "")}
                  onChange={(e) => update("birthDate", isoToGermanDate(e.target.value))}
                  className="input"
                />
              </Field>
              <Field id="birthPlace" label={dict.editor.birthPlace} optionalLabel={dict.editor.optional}>
                <input id="birthPlace" value={data.birthPlace ?? ""} onChange={(e) => update("birthPlace", e.target.value)} className="input" />
              </Field>
              <Field id="nationality" label={dict.editor.nationality} optionalLabel={dict.editor.optional}>
                <input id="nationality" value={data.nationality ?? ""} onChange={(e) => update("nationality", e.target.value)} className="input" />
              </Field>
            </div>
          </section>
        )}

        {template.category === "ATS" ? (
          // Les mises en page ATS n'ont aucun emplacement photo (voir
          // AtsMinimal/AtsExecutif/AtsCompact) : proposer d'en ajouter une
          // serait un bouton sans effet.
          <section className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
            <h2 className="text-base font-semibold tracking-tight">{dict.editor.photo}</h2>
            <p className="text-sm text-black/60 dark:text-white/60">{dict.editor.atsNoPhoto}</p>
          </section>
        ) : (
          <PhotoPicker
            photoDataUrl={includePhoto ? data.photoDataUrl : null}
            photoScale={data.photoScale ?? 1}
            error={photoError}
            onFile={handlePhotoChange}
            onRemove={removePhoto}
            onScaleChange={(scale) => update("photoScale", scale)}
            labels={dict.editor}
          />
        )}

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.experience}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={noExperience} onChange={(e) => setNoExperience(e.target.checked)} />
            {dict.editor.noExperienceLabel}
          </label>
          {noExperience ? (
            <p className="text-xs text-black/50 dark:text-white/50">{dict.editor.noExperienceHint}</p>
          ) : (
            <>
              {data.experience.map((exp, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-black/10 bg-background/50 p-4 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                    {dict.editor.experience} {i + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field id={`exp-role-${i}`} label={dict.editor.role}>
                      <input id={`exp-role-${i}`} value={exp.role} onChange={(e) => update("experience", data.experience.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} className="input" />
                    </Field>
                    <Field id={`exp-company-${i}`} label={dict.editor.company}>
                      <input id={`exp-company-${i}`} value={exp.company} onChange={(e) => update("experience", data.experience.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))} className="input" />
                    </Field>
                    <Field id={`exp-location-${i}`} label={dict.editor.location} optionalLabel={dict.editor.optional}>
                      <input id={`exp-location-${i}`} value={exp.location ?? ""} onChange={(e) => update("experience", data.experience.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))} className="input" />
                    </Field>
                    <Field id={`exp-start-${i}`} label={dict.editor.startDate}>
                      <input
                        id={`exp-start-${i}`}
                        type="date"
                        value={monthYearInputValue(`exp-start-${i}`, exp.start)}
                        onChange={(e) =>
                          handleMonthYearChange(`exp-start-${i}`, e.target.value, (monthYear) =>
                            update("experience", data.experience.map((x, j) => (j === i ? { ...x, start: monthYear } : x))),
                          )
                        }
                        className="input"
                      />
                    </Field>
                    <Field id={`exp-end-${i}`} label={dict.editor.endDate}>
                      {isPresent(exp.end) ? (
                        <input id={`exp-end-${i}`} disabled value={presentLabel(locale, isGerman)} className="input opacity-60" />
                      ) : (
                        <input
                          id={`exp-end-${i}`}
                          type="date"
                          value={monthYearInputValue(`exp-end-${i}`, exp.end)}
                          onChange={(e) =>
                            handleMonthYearChange(`exp-end-${i}`, e.target.value, (monthYear) =>
                              update("experience", data.experience.map((x, j) => (j === i ? { ...x, end: monthYear } : x))),
                            )
                          }
                          className="input"
                        />
                      )}
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                    <input
                      type="checkbox"
                      checked={isPresent(exp.end)}
                      onChange={(e) =>
                        update(
                          "experience",
                          data.experience.map((x, j) => (j === i ? { ...x, end: e.target.checked ? presentLabel(locale, isGerman) : "" } : x)),
                        )
                      }
                    />
                    {dict.editor.currentPosition}
                  </label>
                  <Field id={`exp-description-${i}`} label={dict.editor.description} optionalLabel={dict.editor.optional}>
                    <textarea id={`exp-description-${i}`} value={exp.description} onChange={(e) => update("experience", data.experience.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} className="input" />
                  </Field>
                  <button type="button" onClick={() => update("experience", data.experience.filter((_, j) => j !== i))} className="self-start text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400">
                    {dict.editor.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update("experience", [...data.experience, { role: "", company: "", location: "", start: "", end: "", description: "" }])}
                className="self-start rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
              >
                + {dict.editor.addExperience}
              </button>
            </>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.education}</h2>
          {data.education.map((ed, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-black/10 bg-background/50 p-4 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                {dict.editor.education} {i + 1}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Field id={`ed-degree-${i}`} label={dict.editor.degree}>
                  <input id={`ed-degree-${i}`} value={ed.degree} onChange={(e) => update("education", data.education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x)))} className="input" />
                </Field>
                <Field id={`ed-school-${i}`} label={dict.editor.school}>
                  <input id={`ed-school-${i}`} value={ed.school} onChange={(e) => update("education", data.education.map((x, j) => (j === i ? { ...x, school: e.target.value } : x)))} className="input" />
                </Field>
                <Field id={`ed-location-${i}`} label={dict.editor.location} optionalLabel={dict.editor.optional}>
                  <input id={`ed-location-${i}`} value={ed.location ?? ""} onChange={(e) => update("education", data.education.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))} className="input" />
                </Field>
                <Field id={`ed-start-${i}`} label={dict.editor.startDate}>
                  <input
                    id={`ed-start-${i}`}
                    type="date"
                    value={monthYearInputValue(`ed-start-${i}`, ed.start)}
                    onChange={(e) =>
                      handleMonthYearChange(`ed-start-${i}`, e.target.value, (monthYear) =>
                        update("education", data.education.map((x, j) => (j === i ? { ...x, start: monthYear } : x))),
                      )
                    }
                    className="input"
                  />
                </Field>
                <Field id={`ed-end-${i}`} label={dict.editor.endDate}>
                  {isPresent(ed.end) ? (
                    <input id={`ed-end-${i}`} disabled value={presentLabel(locale, isGerman)} className="input opacity-60" />
                  ) : (
                    <input
                      id={`ed-end-${i}`}
                      type="date"
                      value={monthYearInputValue(`ed-end-${i}`, ed.end)}
                      onChange={(e) =>
                        handleMonthYearChange(`ed-end-${i}`, e.target.value, (monthYear) =>
                          update("education", data.education.map((x, j) => (j === i ? { ...x, end: monthYear } : x))),
                        )
                      }
                      className="input"
                    />
                  )}
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                <input
                  type="checkbox"
                  checked={isPresent(ed.end)}
                  onChange={(e) =>
                    update(
                      "education",
                      data.education.map((x, j) => (j === i ? { ...x, end: e.target.checked ? presentLabel(locale, isGerman) : "" } : x)),
                    )
                  }
                />
                {dict.editor.currentlyStudying}
              </label>
              <button type="button" onClick={() => update("education", data.education.filter((_, j) => j !== i))} className="self-start text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400">
                {dict.editor.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("education", [...data.education, { degree: "", school: "", location: "", start: "", end: "", description: "" }])}
            className="self-start rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          >
            + {dict.editor.addEducation}
          </button>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.skillsHeading}</h2>
          <Field id="skills" label={dict.editor.skills}>
            <input
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="input"
              placeholder={isGerman ? "Erste-Hilfe-Kurs, EDV-Kenntnisse, ..." : "Excel, Communication, ..."}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.languages}</h2>
          {isGerman && <p className="-mt-1 text-xs text-black/50 dark:text-white/50">{dict.editor.germanLanguageHint}</p>}
          {data.languages.map((lang, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field id={`lang-name-${i}`} label={dict.editor.language}>
                <input
                  id={`lang-name-${i}`}
                  placeholder={isGerman ? "Deutsch, Français, ..." : undefined}
                  value={lang.name}
                  onChange={(e) => update("languages", data.languages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  className="input"
                />
              </Field>
              <Field id={`lang-level-${i}`} label={dict.editor.level}>
                <select
                  id={`lang-level-${i}`}
                  value={lang.level}
                  onChange={(e) => update("languages", data.languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}
                  className="input"
                >
                  <option value="" disabled>
                    {dict.editor.selectLevel}
                  </option>
                  {(isGerman ? (i === 0 ? CEFR_LEVELS : GERMAN_GENERAL_LEVELS) : GENERAL_LEVELS(dict)).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="button"
                onClick={() => update("languages", data.languages.filter((_, j) => j !== i))}
                className="shrink-0 pb-2 text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
              >
                {dict.editor.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("languages", [...data.languages, { name: "", level: "" }])}
            className="self-start rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          >
            + {dict.editor.addLanguage}
          </button>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <h2 className="text-base font-semibold tracking-tight">{dict.editor.extraSectionHeading}</h2>
          <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{dict.editor.extraSectionHint}</p>
          <Field id="extraTitle" label={dict.editor.extraSectionTitle} optionalLabel={dict.editor.optional}>
            <input
              id="extraTitle"
              value={data.extras?.[0]?.title ?? ""}
              onChange={(e) =>
                update("extras", e.target.value ? [{ title: e.target.value, content: data.extras?.[0]?.content ?? "" }] : [])
              }
              className="input"
              placeholder={dict.editor.extraSectionTitlePlaceholder}
            />
          </Field>
          {(data.extras?.[0]?.title ?? "") && (
            <Field id="extraContent" label={dict.editor.extraSectionContent} optionalLabel={dict.editor.optional}>
              <textarea
                id="extraContent"
                value={data.extras?.[0]?.content ?? ""}
                onChange={(e) => update("extras", [{ title: data.extras?.[0]?.title ?? "", content: e.target.value }])}
                className="input min-h-24"
              />
            </Field>
          )}
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
          <CvRenderer
            data={{
              ...data,
              experience: noExperience ? [] : data.experience,
              skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
              // La ligne "langue" vide par défaut ne doit jamais atteindre le
              // rendu : plusieurs mises en page l'affichent en "nom (niveau)",
              // ce qui produirait littéralement " ()" sans ce filtre.
              languages: data.languages.filter((l) => l.name.trim()),
            }}
            layoutId={template.layoutId}
            theme={template.theme}
            includePhoto={includePhoto}
            locale={locale}
          />
        </EditorA4Preview>
      </div>
      </div>
    </div>
  );
}
