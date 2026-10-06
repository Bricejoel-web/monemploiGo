import { parseImageDataUrl } from "../security/image-data-url";
import type { CvData } from "./types";

/**
 * Photo du CV : réduite à 500 px en JPEG par l'éditeur (moins de 150 Ko en
 * pratique). Le serveur la revérifie : PNG, JPEG ou WebP réel, 1,5 Mo au
 * plus. Tout autre contenu (texte, SVG, adresse externe) est retiré.
 */
const CV_PHOTO_MAX_BYTES = 1_500_000;

/**
 * Le formulaire démarre avec une ligne vide par défaut pour chaque liste
 * (expérience/formation/langue) : les entrées jamais remplies ne doivent
 * jamais atteindre le document final, sous peine d'un titre de section
 * vide, voire d'artefacts visibles comme " ()" pour une langue sans nom
 * (plusieurs mises en page affichent "nom (niveau)"). Utilisé à
 * l'enregistrement (côté serveur uniquement), par l'espace particulier
 * comme par l'espace Pro.
 */
export function cleanCvData(data: CvData): CvData {
  return {
    ...data,
    experience: data.experience.filter((exp) => exp.role.trim() || exp.company.trim()),
    education: data.education.filter((ed) => ed.degree.trim() || ed.school.trim()),
    languages: data.languages.filter((l) => l.name.trim()),
    extras: data.extras?.[0]?.title.trim() ? [{ title: data.extras[0].title, content: data.extras[0].content }] : [],
    certifications: data.certifications?.filter((c) => c.name.trim()),
    photoDataUrl: data.photoDataUrl ? parseImageDataUrl(data.photoDataUrl, CV_PHOTO_MAX_BYTES) : null,
  };
}
