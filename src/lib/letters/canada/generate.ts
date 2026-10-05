import type { CanadaLetterContent, CandidateProfile } from "./profile";

// Générateur de la lettre de présentation Canada, par règles (sans IA).
// Chaque phrase est construite uniquement à partir d'informations saisies
// ou vérifiées par le candidat : aucune année d'expérience, compétence,
// diplôme, chiffre ou fait sur l'entreprise n'est inventé. Les phrases
// françaises évitent les accords de genre (« basé », « heureux ») faute
// d'information sur le candidat. Jamais de mention d'immigration, de visa
// ou d'autorisation de travail ; la mobilité n'apparaît que si le candidat
// l'a choisie.

export interface GeneratedLetter {
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signature: string;
}

const words = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

/** Expérience la plus pertinente : la plus proche du poste visé, sinon la plus récente. */
function relevantExperience(profile: CandidateProfile, position: string) {
  const target = new Set(words(position));
  const filled = profile.experience.filter((e) => e.role.trim() || e.company.trim());
  if (!filled.length) return undefined;
  const scored = filled.map((e, index) => ({ e, index, score: words(`${e.role} ${e.description}`).filter((w) => target.has(w)).length }));
  scored.sort((a, b) => b.score - a.score || Number(b.e.current) - Number(a.e.current) || a.index - b.index);
  return scored[0].e;
}

/** Compétences à mettre en avant : d'abord celles citées dans l'offre, puis les autres (jamais d'ajout). */
function highlightedSkills(profile: CandidateProfile, offerText = "", max = 4) {
  const offer = new Set(words(offerText));
  const inOffer = (s: string) => words(s).some((w) => offer.has(w));
  return [...profile.skills.filter(inOffer), ...profile.skills.filter((s) => !inOffer(s))].slice(0, max);
}

// Minuscule initiale en milieu de phrase, sauf sigles (« B2 », « OHADA ») et
// noms d'outils ou de marques, qui gardent leur majuscule.
const PROPER = new Set(["excel", "word", "powerpoint", "outlook", "office", "sage", "sap", "odoo", "quickbooks", "python", "java", "javascript", "typescript", "react", "sql", "php", "google", "microsoft", "canva", "photoshop", "illustrator", "autocad", "wordpress", "linux", "windows", "power", "ohada", "erp", "crm"]);
const lowerFirst = (s: string) => {
  const first = s.split(/[\s,/(-]/)[0];
  if (!s || /^[^a-zà-ÿ]*[A-ZÀ-Þ0-9]{2}/.test(first) || PROPER.has(first.toLowerCase())) return s;
  return s[0].toLowerCase() + s.slice(1);
};
// « de » élidé devant une voyelle ou un h : « poste d'assistante », « fonctions d'infirmier ».
const de = (word: string) => (/^[aeiouyàâäéèêëîïôöùûüh]/i.test(word) ? `d'${word}` : `de ${word}`);
const sameJob = (a: string, b: string) => words(a).some((w) => words(b).includes(w));
const listFr = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`);
const listEn = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const achievements = (description: string, max = 3) =>
  description
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").replace(/[.;]\s*$/, "").trim())
    .filter(Boolean)
    .slice(0, max);

export function buildCanadaLetter(content: CanadaLetterContent): GeneratedLetter {
  const { profile, job, options } = content;
  const fr = options.language === "fr";
  const position = job.position.trim();
  const company = job.company.trim();
  const fullName = [profile.personalInfo.firstName, profile.personalInfo.lastName].filter(Boolean).join(" ");
  const exp = relevantExperience(profile, position);
  const skills = highlightedSkills(profile, job.offerText);
  const education = profile.education.find((e) => e.degree.trim());
  const certification = profile.certifications.find((c) => c.name.trim());
  const languages = profile.languages.filter((l) => l.name.trim());
  const ref = job.reference?.trim();
  const paragraphs: string[] = [];

  if (fr) {
    // 6. Introduction : poste, intérêt, expérience ou formation clé. Jamais
    // de préposition devant un nom d'entreprise (« chez Société… », « au
    // sein de Groupe… ») : l'article correct ne peut pas être deviné.
    const where = company ? " au sein de votre entreprise" : "";
    const degree = education ? [education.degree, education.school].filter(Boolean).join(", ") : "";
    if (exp?.role) {
      const experience = sameJob(exp.role, position) ? "une expérience professionnelle dans ce métier" : `une expérience ${de(lowerFirst(exp.role))}`;
      paragraphs.push(`Avec ${experience}, je souhaite vous soumettre ma candidature au poste ${de(lowerFirst(position))}${where}.`);
    } else if (education) {
      paragraphs.push(`À l'issue de ma formation (${degree}), je souhaite vous soumettre ma candidature au poste ${de(lowerFirst(position))}${where}.`);
    } else {
      paragraphs.push(`Je souhaite vous soumettre ma candidature au poste ${de(lowerFirst(position))}${where}.`);
    }

    // 7 et 8. Correspondance avec le poste, expérience et compétences.
    const parts: string[] = [];
    const missions = exp ? achievements(exp.description) : [];
    if (missions.length) {
      const role = exp!.role ? `${de(lowerFirst(exp!.role))}${exp!.company ? ` (${exp!.company})` : ""}` : "actuelles";
      parts.push(`Dans mes fonctions ${role}, mes missions ont notamment porté sur : ${listFr(missions.map(lowerFirst))}.`);
    }
    if (skills.length) parts.push(`Ce parcours m'a permis de développer des compétences en ${listFr(skills.map(lowerFirst))}, directement utiles pour ce poste.`);
    const extras: string[] = [];
    if (education && exp?.role) extras.push(`ma formation (${degree})`);
    if (certification) extras.push(`ma certification « ${certification.name} »${certification.issuer ? ` (${certification.issuer})` : ""}`);
    if (extras.length) parts.push(`${listFr(extras)[0].toUpperCase()}${listFr(extras).slice(1)} complète${extras.length > 1 ? "nt" : ""} ce parcours.`);
    if (languages.length) parts.push(`Je m'exprime en ${listFr(languages.map((l) => (l.level ? `${lowerFirst(l.name)} (${lowerFirst(l.level)})` : lowerFirst(l.name))))}.`);
    if (parts.length) paragraphs.push(parts.join(" "));

    // 9. Motivation pour l'entreprise : texte du candidat, sinon formulation générale.
    paragraphs.push(
      job.whyCompany?.trim() ||
        "Rejoindre votre entreprise me permettrait de mettre ces compétences au service de votre équipe et de poursuivre mon développement professionnel dans un environnement exigeant.",
    );

    // 10. Mobilité, seulement si choisie (formulation sans accord de genre).
    if (options.mobility === "yes") {
      paragraphs.push("Je réside actuellement au Cameroun et je suis disponible pour une mobilité professionnelle vers le Canada, pour une opportunité correspondant à mon expérience et à mes compétences.");
    }

    // 11. Conclusion.
    paragraphs.push(
      "J'aimerais beaucoup échanger avec vous afin de discuter plus en détail de mon parcours et de la manière dont je pourrais contribuer à votre équipe. Je vous remercie de l'attention portée à ma candidature et reste disponible pour un entretien.",
    );

    return {
      subject: `Candidature au poste ${de(lowerFirst(position))}${ref ? ` (réf. ${ref})` : ""}`,
      salutation: "Madame, Monsieur,",
      paragraphs,
      closing: "Cordialement,",
      signature: fullName,
    };
  }

  // Anglais : rédaction propre, pas une traduction mot à mot.
  const at = company ? ` at ${company}` : "";
  if (exp?.role) {
    paragraphs.push(`With experience as ${/^[aeiou]/i.test(exp.role) ? "an" : "a"} ${exp.role}${exp.company ? ` at ${exp.company}` : ""}, I am pleased to submit my application for the ${position} position${at}.`);
  } else if (education) {
    paragraphs.push(`Having completed a ${education.degree}${education.school ? ` at ${education.school}` : ""}, I am pleased to submit my application for the ${position} position${at}.`);
  } else {
    paragraphs.push(`I am pleased to submit my application for the ${position} position${at}.`);
  }

  const parts: string[] = [];
  const missions = exp ? achievements(exp.description) : [];
  // Tournure à deux-points : correcte que le candidat ait écrit des verbes
  // (« Managed… ») ou des noms (« Management of… »).
  if (missions.length) {
    const role = exp!.role ? `my role as ${exp!.role}${exp!.company ? ` at ${exp!.company}` : ""}` : "my current role";
    parts.push(`Highlights of ${role}: ${listEn(missions.map(lowerFirst))}.`);
  }
  if (skills.length) parts.push(`This experience has strengthened my skills in ${listEn(skills.map(lowerFirst))}, which are directly relevant to this role.`);
  const extras: string[] = [];
  if (education && exp?.role) extras.push(`my ${education.degree}`);
  if (certification) extras.push(`my ${certification.name}${certification.issuer ? ` (${certification.issuer})` : ""}`);
  if (extras.length) parts.push(`${listEn(extras)[0].toUpperCase()}${listEn(extras).slice(1)} further support${extras.length > 1 ? "" : "s"} this background.`);
  if (languages.length) parts.push(`I speak ${listEn(languages.map((l) => (l.level ? `${l.name} (${lowerFirst(l.level)})` : l.name)))}.`);
  if (parts.length) paragraphs.push(parts.join(" "));

  paragraphs.push(job.whyCompany?.trim() || `Joining ${company || "your organization"} would allow me to bring these skills to your team while continuing to grow professionally in a demanding environment.`);
  if (options.mobility === "yes") {
    paragraphs.push("Currently based in Cameroon, I am open to relocating to Canada for an opportunity that aligns with my experience and skills.");
  }
  paragraphs.push("I would welcome the opportunity to discuss my background and how I could contribute to your team. Thank you for considering my application. I remain available for an interview at your convenience.");

  const recruiter = job.recruiterName?.trim();
  return {
    subject: `Application for the ${position} position${ref ? ` (Ref. ${ref})` : ""}`,
    salutation: recruiter ? `Dear ${recruiter},` : "Dear Hiring Manager,",
    paragraphs,
    closing: "Sincerely,",
    signature: fullName,
  };
}
