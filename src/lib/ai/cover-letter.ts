import "server-only";
import type { CoverLetterData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { callOpenAiChat, isOpenAiConfigured } from "./openai-client";

/**
 * Même principe hybride que src/lib/ai/bewerbungsbrief.ts, appliqué aux
 * lettres de motivation classiques (françaises et anglaises), avec la même
 * exigence de qualité : le texte doit se lire comme rédigé par un être
 * humain — plusieurs paragraphes courts (une idée chacun), jamais un seul
 * bloc dense, et jamais de formule passe-partout du type "cela m'a bien
 * préparé aux exigences du poste".
 */

export { isOpenAiConfigured };

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

function pick<T>(variants: T[], seed: string): T {
  return variants[hashSeed(seed) % variants.length];
}

function buildFallbackBodyFr(data: CoverLetterData): string {
  const role = data.jobTitle || "ce poste";
  const company = data.recipientCompany || "votre entreprise";
  const seed = `${data.fullName}-${role}-${company}`;

  const openings = [
    `C'est avec un vif intérêt que je vous adresse ma candidature au poste de ${role} au sein de ${company}.`,
    `Le poste de ${role} que vous proposez au sein de ${company} correspond exactement au type de mission dans lequel je souhaite aujourd'hui m'investir.`,
    `Votre offre pour le poste de ${role} au sein de ${company} a immédiatement retenu mon attention.`,
  ];
  const sourceSentence = data.sourceOfListing ? ` J'ai pris connaissance de cette offre via ${data.sourceOfListing}.` : "";
  const paragraph1 = `${pick(openings, seed)}${sourceSentence}`;

  const traits = pick(
    ["rigueur et fiabilité", "autonomie et sens de l'organisation", "réactivité et esprit d'équipe"],
    `${seed}-traits`,
  );
  const experienceSentence = data.yearsOfExperience
    ? `Au cours de mes ${data.yearsOfExperience} d'expérience dans ce domaine, j'ai eu l'occasion de développer des compétences concrètes, tout en cultivant ${traits}.`
    : "";
  const skillsSentence = data.keySkills
    ? `Je maîtrise en particulier : ${data.keySkills}, des atouts que je saurai mettre directement au service de vos équipes.`
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
  const role = data.jobTitle || "this position";
  const company = data.recipientCompany || "your company";
  const seed = `${data.fullName}-${role}-${company}`;

  const openings = [
    `I am excited to apply for the ${role} position at ${company}.`,
    `The ${role} opening at ${company} is precisely the kind of opportunity I am looking to take on next.`,
    `Your posting for the ${role} position at ${company} immediately caught my attention.`,
  ];
  const sourceSentence = data.sourceOfListing ? ` I came across this opening through ${data.sourceOfListing}.` : "";
  const paragraph1 = `${pick(openings, seed)}${sourceSentence}`;

  const traits = pick(
    ["attention to detail and reliability", "independence and strong organizational skills", "adaptability and a collaborative mindset"],
    `${seed}-traits`,
  );
  const experienceSentence = data.yearsOfExperience
    ? `Over ${data.yearsOfExperience} of experience in this field, I have built practical skills while developing ${traits}.`
    : "";
  const skillsSentence = data.keySkills
    ? `I am particularly skilled in: ${data.keySkills}, strengths I would be glad to bring directly to your team.`
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

export async function generateCoverLetterWithOpenAI(
  data: CoverLetterData,
  locale: Locale,
): Promise<{ text: string } | { error: string }> {
  const lang = locale === "en" ? "English" : "français";
  const prompt = [
    `Tu es un rédacteur professionnel de candidatures. Le texte doit se lire comme rédigé par un être humain — un expert de la candidature — jamais comme un modèle rempli automatiquement. Découpe-le en plusieurs paragraphes courts (une idée chacun : accroche, expérience/compétences, motivation, demande d'entretien), jamais un seul bloc dense.`,
    `Rédige uniquement le corps (paragraphes uniquement — sans formule d'appel, sans formule de politesse finale, sans signature) d'une lettre de motivation en ${lang}, ton professionnel mais naturel, 200 à 300 mots, sans faute.`,
    "Consignes : évite les ouvertures toutes faites ('I am writing to apply', 'Je me permets de vous adresser ma candidature') ; évite les formules passe-partout du type 'cela correspond à ce que vous recherchez' — tire un enseignement concret de l'expérience mentionnée ; propose explicitement un entretien en présentiel ou à distance ; n'invente aucune information non fournie ci-dessous.",
    `Poste visé : ${data.jobTitle || "non précisé"}`,
    `Entreprise destinataire : ${data.recipientCompany || "non précisée"}`,
    `Source de l'offre : ${data.sourceOfListing || "non précisée"}`,
    `Expérience : ${data.yearsOfExperience || "non précisée"}`,
    `Compétences clés : ${data.keySkills || "non précisées"}`,
    `Notes de motivation de la personne : ${data.motivationNotes || "aucune"}`,
  ].join("\n");

  return callOpenAiChat(prompt);
}
