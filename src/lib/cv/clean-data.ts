import type { CvData } from "./types";

/**
 * Le formulaire démarre avec une ligne vide par défaut pour chaque liste
 * (expérience/formation/langue) : les entrées jamais remplies ne doivent
 * jamais atteindre le document final, sous peine d'un titre de section
 * vide, voire d'artefacts visibles comme " ()" pour une langue sans nom
 * (plusieurs mises en page affichent "nom (niveau)"). Utilisé à
 * l'enregistrement, par l'espace particulier comme par l'espace Pro.
 */
export function cleanCvData(data: CvData): CvData {
  return {
    ...data,
    experience: data.experience.filter((exp) => exp.role.trim() || exp.company.trim()),
    education: data.education.filter((ed) => ed.degree.trim() || ed.school.trim()),
    languages: data.languages.filter((l) => l.name.trim()),
    extras: data.extras?.[0]?.title.trim() ? [{ title: data.extras[0].title, content: data.extras[0].content }] : [],
  };
}
