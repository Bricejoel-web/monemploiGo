import "server-only";
import type { CoverLetterData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";

/**
 * Même principe que src/lib/ai/bewerbungsbrief.ts (génération par règles, sans IA), appliqué aux
 * lettres de motivation classiques (françaises et anglaises), avec la même
 * exigence de qualité : le texte doit se lire comme rédigé par un être
 * humain — plusieurs paragraphes courts (une idée chacun), jamais un seul
 * bloc dense, et jamais de formule passe-partout du type "cela m'a bien
 * préparé aux exigences du poste".
 */

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

function pick<T>(variants: T[], seed: string): T {
  return variants[hashSeed(seed) % variants.length];
}

/**
 * Nombre seul (« 3 ») → « 3 ans » / « 3 years » ; texte déjà complet
 * (« 3 ans », « trois années ») laissé tel quel.
 */
function withYears(value: string, unit: "ans" | "years"): string {
  const v = value.trim();
  if (!/^\d+([.,]\d+)?$/.test(v)) return v;
  if (unit === "years") return v === "1" ? "1 year" : `${v} years`;
  return v === "1" ? "1 an" : `${v} ans`;
}

/**
 * Relecture du 2026-09-30 (mêmes défauts que le Bewerbungsbrief avant sa
 * correction) : le nom de l'entreprise n'est plus inséré après « au sein
 * de » (« au sein de Collège… » au lieu de « du Collège », « de Orange » au
 * lieu de « d'Orange ») — il figure déjà dans le bloc du destinataire ; un
 * poste non renseigné ne donne plus « au poste de ce poste » ; « 3 » années
 * d'expérience devient « 3 ans ».
 */
function buildFallbackBodyFr(data: CoverLetterData): string {
  const role = data.jobTitle?.trim();
  const company = data.recipientCompany?.trim() ?? "";
  const seed = `${data.fullName}-${role ?? ""}-${company}`;

  const openings = role
    ? [
        `C'est avec un vif intérêt que je vous adresse ma candidature au poste de ${role} au sein de votre structure.`,
        `Le poste de ${role} que vous proposez correspond exactement au type de mission dans lequel je souhaite aujourd'hui m'investir.`,
        `Votre offre pour le poste de ${role} a immédiatement retenu mon attention.`,
      ]
    : [
        "C'est avec un vif intérêt que je vous adresse ma candidature pour le poste que vous proposez.",
        "Le poste que vous proposez correspond exactement au type de mission dans lequel je souhaite aujourd'hui m'investir.",
        "Votre offre d'emploi a immédiatement retenu mon attention.",
      ];
  const source = data.sourceOfListing?.trim();
  const sourceSentence = source ? ` J'ai pris connaissance de cette offre via ${source}.` : "";
  const paragraph1 = `${pick(openings, seed)}${sourceSentence}`;

  const traits = pick(
    ["rigueur et fiabilité", "autonomie et sens de l'organisation", "réactivité et esprit d'équipe"],
    `${seed}-traits`,
  );
  const years = data.yearsOfExperience?.trim();
  const experienceSentence = years
    ? `Au cours de mes ${withYears(years, "ans")} d'expérience dans ce domaine, j'ai eu l'occasion de développer des compétences concrètes, tout en cultivant ${traits}.`
    : "";
  const skills = data.keySkills?.trim();
  const skillsSentence = skills
    ? `Je maîtrise en particulier : ${skills}, des atouts que je saurai mettre directement au service de vos équipes.`
    : "";
  const paragraph2 = [experienceSentence, skillsSentence].filter(Boolean).join(" ");

  const motivation = data.motivationNotes?.trim() ?? "";

  const closings = [
    "Je serais ravi(e) de vous rencontrer, en personne ou en visioconférence, afin de vous exposer plus en détail ma motivation et la valeur ajoutée que je pourrais apporter à votre équipe.",
    "Convaincu(e) que mon profil saura répondre à vos attentes, je me tiens à votre disposition pour un entretien, en présentiel ou à distance.",
    "Je vous remercie de l'attention portée à ma candidature et serais heureux(se) d'échanger avec vous prochainement, par téléphone ou en visioconférence si besoin.",
  ];

  return [paragraph1, paragraph2, motivation, pick(closings, `${seed}-closing`)].filter(Boolean).join("\n\n");
}

function buildFallbackBodyEn(data: CoverLetterData): string {
  const role = data.jobTitle?.trim();
  const company = data.recipientCompany?.trim() ?? "";
  const seed = `${data.fullName}-${role ?? ""}-${company}`;
  const at = company ? ` at ${company}` : "";

  const openings = role
    ? [
        `I am excited to apply for the ${role} position${at}.`,
        `The ${role} opening${at} is precisely the kind of opportunity I am looking to take on next.`,
        `Your posting for the ${role} position${at} immediately caught my attention.`,
      ]
    : [
        `I am excited to apply for the position you are offering${at}.`,
        `The opening${at} is precisely the kind of opportunity I am looking to take on next.`,
        `Your job posting${at} immediately caught my attention.`,
      ];
  const source = data.sourceOfListing?.trim();
  const sourceSentence = source ? ` I came across this opening through ${source}.` : "";
  const paragraph1 = `${pick(openings, seed)}${sourceSentence}`;

  const traits = pick(
    ["attention to detail and reliability", "independence and strong organizational skills", "adaptability and a collaborative mindset"],
    `${seed}-traits`,
  );
  const years = data.yearsOfExperience?.trim();
  const experienceSentence = years
    ? `Over ${withYears(years, "years")} of experience in this field, I have built practical skills while developing ${traits}.`
    : "";
  const skills = data.keySkills?.trim();
  const skillsSentence = skills
    ? `I am particularly skilled in: ${skills}, strengths I would be glad to bring directly to your team.`
    : "";
  const paragraph2 = [experienceSentence, skillsSentence].filter(Boolean).join(" ");

  const motivation = data.motivationNotes?.trim() ?? "";

  const closings = [
    "I would welcome the opportunity to meet, in person or over a video call, to discuss my application and the value I could bring to your team in more detail.",
    "I am confident my background matches what you are looking for, and I remain available for an interview, whether in person or remotely.",
    "Thank you for considering my application — I look forward to the possibility of speaking with you soon, by phone or video call if more convenient.",
  ];

  return [paragraph1, paragraph2, motivation, pick(closings, `${seed}-closing`)].filter(Boolean).join("\n\n");
}

export function buildFallbackCoverLetterBody(data: CoverLetterData, locale: Locale): string {
  return locale === "en" ? buildFallbackBodyEn(data) : buildFallbackBodyFr(data);
}

