import type { Locale } from "@/i18n/config";

export const cvLabels: Record<Locale, {
  profile: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  namePlaceholder: string;
  jobTitlePlaceholder: string;
  regards: string;
  subjectPlaceholder: string;
  bodyPlaceholder: string;
}> = {
  fr: {
    profile: "Profil",
    experience: "Expérience professionnelle",
    education: "Formation",
    skills: "Compétences",
    languages: "Langues",
    namePlaceholder: "Votre nom",
    jobTitlePlaceholder: "Intitulé du poste recherché",
    regards: "Cordialement,",
    subjectPlaceholder: "Objet de la candidature",
    bodyPlaceholder: "Madame, Monsieur,\n\nRédigez ici le contenu de votre lettre de motivation. Vous pouvez personnaliser entièrement ce texte.",
  },
  en: {
    profile: "Profile",
    experience: "Work experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    namePlaceholder: "Your name",
    jobTitlePlaceholder: "Target job title",
    regards: "Kind regards,",
    subjectPlaceholder: "Application subject",
    bodyPlaceholder: "Dear Hiring Manager,\n\nWrite the content of your cover letter here. You can fully personalize this text.",
  },
};
