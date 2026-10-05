"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { Field } from "@/components/cv/FormField";
import { EditorA4Preview } from "@/components/cv/EditorA4Preview";
import { CanadaLetterView } from "./CanadaLetterView";
import { LETTER_MODELS, letterModelBySlug, letterSlug } from "@/lib/letters/canada/models";
import { buildCanadaLetter } from "@/lib/letters/canada/generate";
import { emptyProfile, type CanadaLetterContent, type CandidateProfile, type LetterJob, type ProfileSource } from "@/lib/letters/canada/profile";
import { importCvPdfAction, saveCanadaLetterAction } from "@/lib/letters/canada/actions";

// Parcours de la lettre de présentation Canada : source du profil (CV
// MonEmploiGo, CV importé ou saisie), vérification, candidature, options,
// puis aperçu avec retouche possible du texte généré. Fonctionne sans CV
// MonEmploiGo. Rien n'est généré à partir d'informations non vérifiées.

type Labels = Dictionary["canadaLetter"];
type Step = 0 | 1 | 2 | 3 | 4;
export interface CvChoice {
  id: string;
  title: string;
  profile: CandidateProfile;
}

const PROVINCES = {
  fr: ["Alberta", "Colombie-Britannique", "Île-du-Prince-Édouard", "Manitoba", "Nouveau-Brunswick", "Nouvelle-Écosse", "Nunavut", "Ontario", "Québec", "Saskatchewan", "Terre-Neuve-et-Labrador", "Territoires du Nord-Ouest", "Yukon"],
  en: ["Alberta", "British Columbia", "Prince Edward Island", "Manitoba", "New Brunswick", "Nova Scotia", "Nunavut", "Ontario", "Quebec", "Saskatchewan", "Newfoundland and Labrador", "Northwest Territories", "Yukon"],
};

const card = "flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]";
const addButton = "self-start rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5 dark:border-white/20 dark:text-white/70";
const removeButton = "self-start text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400";

function defaultDate(lang: Locale, city: string) {
  const date = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-CA", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return lang === "fr" ? `${city ? `${city}, ` : ""}le ${date}` : date;
}

function YesNo({ name, value, onChange, t }: { name: string; value: boolean; onChange: (v: boolean) => void; t: Labels }) {
  return (
    <div className="flex gap-4 text-sm">
      {[true, false].map((v) => (
        <label key={String(v)} className="flex items-center gap-2">
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          {v ? t.yes : t.no}
        </label>
      ))}
    </div>
  );
}

function ProfileForm({ profile, setProfile, hasExperience, setHasExperience, hasCerts, setHasCerts, t }: {
  profile: CandidateProfile;
  setProfile: (p: CandidateProfile) => void;
  hasExperience: boolean;
  setHasExperience: (v: boolean) => void;
  hasCerts: boolean;
  setHasCerts: (v: boolean) => void;
  t: Labels;
}) {
  const p = profile.personalInfo;
  const setPersonal = (patch: Partial<CandidateProfile["personalInfo"]>) => setProfile({ ...profile, personalInfo: { ...p, ...patch } });
  const setItem = <K extends "experience" | "education" | "certifications" | "languages">(key: K, i: number, patch: Partial<CandidateProfile[K][number]>) =>
    setProfile({ ...profile, [key]: profile[key].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const removeItem = (key: "experience" | "education" | "certifications" | "languages", i: number) => setProfile({ ...profile, [key]: profile[key].filter((_, j) => j !== i) });

  return (
    <>
      <section className={card}>
        <h2 className="text-base font-semibold">{t.identity}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="cl-first" label={t.firstName}><input id="cl-first" className="input" value={p.firstName} onChange={(e) => setPersonal({ firstName: e.target.value })} /></Field>
          <Field id="cl-last" label={t.lastName}><input id="cl-last" className="input" value={p.lastName} onChange={(e) => setPersonal({ lastName: e.target.value })} /></Field>
          <Field id="cl-phone" label={t.phone}><input id="cl-phone" type="tel" className="input" value={p.phone} onChange={(e) => setPersonal({ phone: e.target.value })} /></Field>
          <Field id="cl-email" label={t.email}><input id="cl-email" type="email" className="input" value={p.email} onChange={(e) => setPersonal({ email: e.target.value })} /></Field>
          <Field id="cl-city" label={t.city}><input id="cl-city" className="input" value={p.city} onChange={(e) => setPersonal({ city: e.target.value })} /></Field>
          <Field id="cl-country" label={t.country}><input id="cl-country" className="input opacity-70" value="Cameroun" disabled /></Field>
          <Field id="cl-linkedin" label={t.linkedin} optionalLabel={t.optional}><input id="cl-linkedin" className="input" value={p.linkedin ?? ""} onChange={(e) => setPersonal({ linkedin: e.target.value })} /></Field>
          <Field id="cl-website" label={t.website} optionalLabel={t.optional}><input id="cl-website" className="input" value={p.website ?? ""} onChange={(e) => setPersonal({ website: e.target.value })} /></Field>
        </div>
        <Field id="cl-title" label={t.professionalTitle} optionalLabel={t.optional}><input id="cl-title" className="input" value={profile.professionalTitle} onChange={(e) => setProfile({ ...profile, professionalTitle: e.target.value })} /></Field>
        <Field id="cl-skills" label={t.skills}>
          <input id="cl-skills" className="input" value={profile.skills.join(", ")} onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(",").map((s) => s.trimStart()).filter((s, i, all) => s || i === all.length - 1) })} />
        </Field>
        <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.skillsHint}</p>
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">{t.experience}</h2>
        <p className="text-sm">{t.experienceQuestion}</p>
        <YesNo name="has-experience" value={hasExperience} onChange={setHasExperience} t={t} />
        {hasExperience &&
          profile.experience.map((exp, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id={`exp-role-${i}`} label={t.role}><input id={`exp-role-${i}`} className="input" value={exp.role} onChange={(e) => setItem("experience", i, { role: e.target.value })} /></Field>
                <Field id={`exp-company-${i}`} label={t.company}><input id={`exp-company-${i}`} className="input" value={exp.company} onChange={(e) => setItem("experience", i, { company: e.target.value })} /></Field>
                <Field id={`exp-location-${i}`} label={t.location} optionalLabel={t.optional}><input id={`exp-location-${i}`} className="input" value={exp.location ?? ""} onChange={(e) => setItem("experience", i, { location: e.target.value })} /></Field>
                <Field id={`exp-start-${i}`} label={t.start}><input id={`exp-start-${i}`} className="input" placeholder="03/2021" value={exp.start} onChange={(e) => setItem("experience", i, { start: e.target.value })} /></Field>
                {!exp.current && <Field id={`exp-end-${i}`} label={t.end}><input id={`exp-end-${i}`} className="input" placeholder="02/2024" value={exp.end} onChange={(e) => setItem("experience", i, { end: e.target.value })} /></Field>}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={exp.current} onChange={(e) => setItem("experience", i, { current: e.target.checked, end: e.target.checked ? "" : exp.end })} />
                {t.current}
              </label>
              <Field id={`exp-desc-${i}`} label={t.description}><textarea id={`exp-desc-${i}`} className="input min-h-20" value={exp.description} onChange={(e) => setItem("experience", i, { description: e.target.value })} /></Field>
              <button type="button" className={removeButton} onClick={() => removeItem("experience", i)}>{t.remove}</button>
            </div>
          ))}
        {hasExperience && (
          <button type="button" className={addButton} onClick={() => setProfile({ ...profile, experience: [...profile.experience, { role: "", company: "", start: "", end: "", current: false, description: "" }] })}>
            + {t.addExperience}
          </button>
        )}
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">{t.education}</h2>
        {profile.education.map((ed, i) => (
          <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-3 sm:grid-cols-2 dark:border-white/10">
            <Field id={`ed-degree-${i}`} label={t.degree}><input id={`ed-degree-${i}`} className="input" value={ed.degree} onChange={(e) => setItem("education", i, { degree: e.target.value })} /></Field>
            <Field id={`ed-school-${i}`} label={t.school}><input id={`ed-school-${i}`} className="input" value={ed.school} onChange={(e) => setItem("education", i, { school: e.target.value })} /></Field>
            <Field id={`ed-location-${i}`} label={t.location} optionalLabel={t.optional}><input id={`ed-location-${i}`} className="input" value={ed.location ?? ""} onChange={(e) => setItem("education", i, { location: e.target.value })} /></Field>
            <Field id={`ed-period-${i}`} label={t.period}><input id={`ed-period-${i}`} className="input" value={ed.period} onChange={(e) => setItem("education", i, { period: e.target.value })} /></Field>
            <button type="button" className={removeButton} onClick={() => removeItem("education", i)}>{t.remove}</button>
          </div>
        ))}
        <button type="button" className={addButton} onClick={() => setProfile({ ...profile, education: [...profile.education, { degree: "", school: "", period: "" }] })}>
          + {t.addEducation}
        </button>
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">{t.certificationsQuestion}</h2>
        <YesNo name="has-certs" value={hasCerts} onChange={setHasCerts} t={t} />
        {hasCerts &&
          profile.certifications.map((c, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-3 sm:grid-cols-[1fr_1fr_6rem] dark:border-white/10">
              <Field id={`cert-name-${i}`} label={t.certName}><input id={`cert-name-${i}`} className="input" value={c.name} onChange={(e) => setItem("certifications", i, { name: e.target.value })} /></Field>
              <Field id={`cert-issuer-${i}`} label={t.certIssuer} optionalLabel={t.optional}><input id={`cert-issuer-${i}`} className="input" value={c.issuer} onChange={(e) => setItem("certifications", i, { issuer: e.target.value })} /></Field>
              <Field id={`cert-year-${i}`} label={t.certYear} optionalLabel={t.optional}><input id={`cert-year-${i}`} className="input" inputMode="numeric" maxLength={4} value={c.year ?? ""} onChange={(e) => setItem("certifications", i, { year: e.target.value.replace(/\D/g, "") })} /></Field>
              <button type="button" className={removeButton} onClick={() => removeItem("certifications", i)}>{t.remove}</button>
            </div>
          ))}
        {hasCerts && (
          <button type="button" className={addButton} onClick={() => setProfile({ ...profile, certifications: [...profile.certifications, { name: "", issuer: "", year: "" }] })}>
            + {t.addCertification}
          </button>
        )}
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">{t.languages}</h2>
        {profile.languages.map((l, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field id={`lang-name-${i}`} label={t.languageName}><input id={`lang-name-${i}`} className="input" value={l.name} onChange={(e) => setItem("languages", i, { name: e.target.value })} /></Field>
            <Field id={`lang-level-${i}`} label={t.languageLevel}><input id={`lang-level-${i}`} className="input" value={l.level} onChange={(e) => setItem("languages", i, { level: e.target.value })} /></Field>
            <button type="button" className={`${removeButton} pb-2`} onClick={() => removeItem("languages", i)}>{t.remove}</button>
          </div>
        ))}
        <button type="button" className={addButton} onClick={() => setProfile({ ...profile, languages: [...profile.languages, { name: "", level: "" }] })}>
          + {t.addLanguage}
        </button>
      </section>
    </>
  );
}

function JobForm({ job, setJob, lang, t }: { job: LetterJob; setJob: (j: LetterJob) => void; lang: Locale; t: Labels }) {
  const set = (patch: Partial<LetterJob>) => setJob({ ...job, ...patch });
  return (
    <section className={card}>
      <h2 className="text-base font-semibold">{t.jobTitle}</h2>
      <Field id="job-position" label={t.position}><input id="job-position" className="input" value={job.position} onChange={(e) => set({ position: e.target.value })} /></Field>
      <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.positionHint}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="job-company" label={t.jobCompany}><input id="job-company" className="input" value={job.company} onChange={(e) => set({ company: e.target.value })} /></Field>
        <Field id="job-recruiter" label={t.recruiter} optionalLabel={t.optional}><input id="job-recruiter" className="input" value={job.recruiterName ?? ""} onChange={(e) => set({ recruiterName: e.target.value })} /></Field>
        <Field id="job-city" label={t.jobCity} optionalLabel={t.optional}><input id="job-city" className="input" value={job.city ?? ""} onChange={(e) => set({ city: e.target.value })} /></Field>
        <Field id="job-province" label={t.province} optionalLabel={t.optional}>
          <input id="job-province" className="input" list="provinces" value={job.province ?? ""} onChange={(e) => set({ province: e.target.value })} />
          <datalist id="provinces">{PROVINCES[lang].map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field id="job-reference" label={t.reference} optionalLabel={t.optional}><input id="job-reference" className="input" value={job.reference ?? ""} onChange={(e) => set({ reference: e.target.value })} /></Field>
      </div>
      <Field id="job-offer" label={t.offer} optionalLabel={t.optional}><textarea id="job-offer" className="input min-h-28" value={job.offerText ?? ""} onChange={(e) => set({ offerText: e.target.value })} /></Field>
      <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.offerHint}</p>
      <Field id="job-why" label={t.why} optionalLabel={t.optional}><textarea id="job-why" className="input min-h-20" value={job.whyCompany ?? ""} onChange={(e) => set({ whyCompany: e.target.value })} /></Field>
      <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.whyHint}</p>
    </section>
  );
}

export function CanadaLetterWizard({ locale, t, pageLabels, priceFcfa, cvs, initial }: {
  locale: Locale;
  t: Labels;
  pageLabels: { fits: string; overflow: string; hint: string };
  priceFcfa: number;
  cvs: CvChoice[];
  initial?: { documentId: string; slug: string; content: CanadaLetterContent };
}) {
  const [step, setStep] = useState<Step>(initial ? 1 : 0);
  const [source, setSource] = useState<ProfileSource>(initial?.content.source ?? "manual");
  const [profile, setProfileState] = useState<CandidateProfile>(initial?.content.profile ?? emptyProfile());
  const [job, setJobState] = useState<LetterJob>(initial?.content.job ?? { position: "", company: "" });
  const [language, setLanguage] = useState<Locale>(initial?.content.options.language ?? locale);
  const [mobility, setMobility] = useState<CanadaLetterContent["options"]["mobility"]>(initial?.content.options.mobility ?? "omit");
  const [date, setDate] = useState(initial?.content.date ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? letterSlug(LETTER_MODELS[0]));
  const [custom, setCustom] = useState<string[] | undefined>(initial?.content.customParagraphs);
  const [hasExperience, setHasExperience] = useState(initial ? initial.content.profile.experience.length > 0 : true);
  const [hasCerts, setHasCerts] = useState(initial ? initial.content.profile.certifications.length > 0 : false);
  const [uncertain, setUncertain] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [importing, startImport] = useTransition();
  const [saving, startSave] = useTransition();

  // Toute modification des informations remet le texte généré à jour.
  const setProfile = (p: CandidateProfile) => {
    setProfileState(p);
    setCustom(undefined);
  };
  const setJob = (j: LetterJob) => {
    setJobState(j);
    setCustom(undefined);
  };

  const content: CanadaLetterContent = {
    source,
    profile: {
      ...profile,
      personalInfo: { ...profile.personalInfo, country: "Cameroun" },
      skills: profile.skills.map((s) => s.trim()).filter(Boolean),
      experience: hasExperience ? profile.experience.filter((e) => e.role.trim() || e.company.trim() || e.description.trim()) : [],
      education: profile.education.filter((e) => e.degree.trim() || e.school.trim()),
      certifications: hasCerts ? profile.certifications.filter((c) => c.name.trim()) : [],
      languages: profile.languages.filter((l) => l.name.trim()),
    },
    job,
    options: { language, mobility },
    date: date || defaultDate(language, profile.personalInfo.city),
    customParagraphs: custom,
  };
  const model = letterModelBySlug(slug) ?? LETTER_MODELS[0];

  const start = (from: ProfileSource, p: CandidateProfile, notes: string[] = []) => {
    setSource(from);
    // Saisie manuelle : une ligne vide par rubrique, prête à être remplie.
    setProfile(
      from === "manual"
        ? { ...p, experience: [{ role: "", company: "", start: "", end: "", current: false, description: "" }], education: [{ degree: "", school: "", period: "" }], languages: [{ name: "", level: "" }] }
        : p,
    );
    setHasExperience(p.experience.length > 0 || from === "manual");
    setHasCerts(p.certifications.length > 0);
    setUncertain(notes);
    setStep(1);
  };

  const importCv = (file: File) => {
    setError(undefined);
    const data = new FormData();
    data.set("cv", file);
    startImport(async () => {
      const result = await importCvPdfAction(data);
      if ("error" in result) setError(t.importErrors[result.error]);
      else start("import", result.profile, result.uncertain);
    });
  };

  const canContinue =
    step === 1 ? Boolean(profile.personalInfo.firstName.trim() && profile.personalInfo.lastName.trim()) : step === 2 ? Boolean(job.position.trim()) : true;

  const save = () => {
    setError(undefined);
    startSave(async () => {
      try {
        await saveCanadaLetterAction(locale, slug, content, initial?.documentId);
      } catch (e) {
        unstable_rethrow(e);
        setError(t.saveError);
      }
    });
  };

  const generated = buildCanadaLetter({ ...content, customParagraphs: undefined }).paragraphs;

  return (
    <div className="bg-[#efe6d8] py-10 dark:bg-white/[0.05]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t.subtitle}</p>
            <ol className="mt-4 flex flex-wrap gap-2 text-xs">
              {t.steps.map((label, i) => (
                <li key={label} className={`rounded-full px-3 py-1 ${i === step ? "bg-[#16324f] text-white" : "bg-black/5 dark:bg-white/10"}`}>
                  {i + 1}. {label}
                </li>
              ))}
            </ol>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700/50 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

          {step === 0 && (
            <section className={card}>
              <h2 className="text-base font-semibold">{t.sourceQuestion}</h2>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                  <p className="font-semibold">{t.sourceCv}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">{cvs.length ? t.sourceCvHint : t.sourceCvNone}</p>
                  {cvs.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2" role="group" aria-label={t.chooseCv}>
                      {cvs.map((cv) => (
                        <button key={cv.id} type="button" className="rounded-lg border border-black/15 px-3 py-2 text-left text-sm hover:bg-black/5 dark:border-white/20" onClick={() => start("monemploigo", cv.profile)}>
                          {cv.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-black/10 p-4 hover:bg-black/[0.02] dark:border-white/10">
                  <p className="font-semibold">{importing ? t.importing : t.sourceImport}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">{t.sourceImportHint}</p>
                  <input type="file" accept="application/pdf" className="mt-3 text-sm" disabled={importing} onChange={(e) => e.target.files?.[0] && importCv(e.target.files[0])} />
                </label>
                <button type="button" className="rounded-xl border border-black/10 p-4 text-left hover:bg-black/[0.02] dark:border-white/10" onClick={() => start("manual", emptyProfile())}>
                  <span className="block font-semibold">{t.sourceManual}</span>
                  <span className="block text-xs text-black/60 dark:text-white/60">{t.sourceManualHint}</span>
                </button>
              </div>
            </section>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold">{source === "import" ? t.verifyImportTitle : t.verifyTitle}</h2>
              {uncertain.length > 0 && (
                <div role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-medium">{t.uncertainNotice}</p>
                  <ul className="mt-2 list-disc pl-5 text-xs">{uncertain.map((u) => <li key={u}>{u}</li>)}</ul>
                </div>
              )}
              <p className="text-xs text-black/60 dark:text-white/60">{t.languageNotice}</p>
              <ProfileForm profile={profile} setProfile={setProfile} hasExperience={hasExperience} setHasExperience={(v) => { setHasExperience(v); setCustom(undefined); }} hasCerts={hasCerts} setHasCerts={(v) => { setHasCerts(v); setCustom(undefined); }} t={t} />
            </>
          )}

          {step === 2 && <JobForm job={job} setJob={setJob} lang={language} t={t} />}

          {step === 3 && (
            <section className={card}>
              <h2 className="text-base font-semibold">{t.optionsTitle}</h2>
              <p className="text-sm">{t.mobility}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {(["yes", "no", "omit"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input type="radio" name="mobility" checked={mobility === v} onChange={() => { setMobility(v); setCustom(undefined); }} />
                    {v === "yes" ? t.yes : v === "no" ? t.no : t.mobilityOmit}
                  </label>
                ))}
              </div>
              <Field id="letter-language" label={t.letterLanguage}>
                <select id="letter-language" className="input" value={language} onChange={(e) => { setLanguage(e.target.value as Locale); setDate(""); setCustom(undefined); }}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.languageNotice}</p>
              <Field id="letter-date" label={t.date}><input id="letter-date" className="input" value={content.date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field id="letter-model" label={t.model}>
                <select id="letter-model" className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
                  {LETTER_MODELS.map((m) => <option key={m.id} value={letterSlug(m)}>{m.name}</option>)}
                </select>
              </Field>
            </section>
          )}

          {step === 4 && (
            <section className={card}>
              <h2 className="text-base font-semibold">{t.edit}</h2>
              <p className="-mt-2 text-xs text-black/50 dark:text-white/50">{t.editHint}</p>
              {(custom ?? generated).map((paragraph, i) => (
                <textarea
                  key={i}
                  aria-label={`${t.edit} ${i + 1}`}
                  className="input min-h-20"
                  value={paragraph}
                  onChange={(e) => setCustom((custom ?? generated).map((x, j) => (j === i ? e.target.value : x)))}
                />
              ))}
              {custom && <button type="button" className={addButton} onClick={() => setCustom(undefined)}>{t.reset}</button>}
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? <button type="button" className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20" onClick={() => setStep((step - 1) as Step)}>{t.back}</button> : <span />}
            {step > 0 && step < 4 && (
              <button type="button" disabled={!canContinue} className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50" onClick={() => setStep((step + 1) as Step)}>
                {t.next}
              </button>
            )}
            {step === 4 && (
              <div className="flex items-center gap-3">
                <span className="text-sm">{t.price} : <strong>{priceFcfa} FCFA</strong></span>
                <button type="button" disabled={saving} className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60" onClick={save}>
                  {t.save}
                </button>
              </div>
            )}
          </div>
          {step > 0 && !canContinue && <p className="text-xs text-red-700 dark:text-red-400">{t.required}</p>}
          <p className="text-xs text-black/50 dark:text-white/50">{t.disclaimer}</p>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {step > 0 && (
            <EditorA4Preview pageFitsLabel={pageLabels.fits} pageOverflowLabel={pageLabels.overflow} pageOverflowHint={pageLabels.hint}>
              <CanadaLetterView content={content} model={model} />
            </EditorA4Preview>
          )}
        </div>
      </div>
    </div>
  );
}
