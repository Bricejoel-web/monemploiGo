import "server-only";
import type { BewerbungsbriefData } from "@/lib/cv/types";
import { callOpenAiChat, isOpenAiConfigured } from "./openai-client";

/**
 * Génération hybride du corps du Bewerbungsbrief (Einleitung / Hauptteil /
 * Schluss), à partir des seules informations structurées saisies par
 * l'utilisateur (infos personnelles + attestations de formation) : voir
 * docs/ROADMAP.md, décision validée avec l'utilisateur.
 *
 * Exigence explicite de l'utilisateur, avec un exemple concret retravaillé
 * via ChatGPT à l'appui : le texte doit se lire comme rédigé par un être
 * humain — un expert — pas comme un modèle rempli automatiquement. Trois
 * défauts identifiés en comparant à cet exemple, et corrigés ici :
 *   1. Un seul paragraphe dense ("mur de texte") regroupant motivation,
 *      qualifications, langue et engagement lisait comme généré. Le corps
 *      est maintenant découpé en plusieurs paragraphes courts, chacun une
 *      idée (accroche, expérience concrète, motivation + langue,
 *      installation en Allemagne, valeur ajoutée, demande d'entretien) —
 *      exactement le rythme d'un vrai Bewerbungsschreiben.
 *   2. La clause qualification ("hat mich gut auf die Anforderungen
 *      vorbereitet") était une formule passe-partout. Remplacée par une
 *      phrase qui tire un enseignement concret de l'expérience (qualité
 *      apprise), comme le ferait un candidat réel.
 *   3. La mention de la source de l'annonce, insérée au milieu d'une
 *      phrase, était maladroite. Devient sa propre phrase courte.
 *   Ajout, sur le même modèle validé par l'utilisateur : une phrase
 *   proposant explicitement un entretien en ligne, pertinente pour des
 *   candidats qui postulent depuis l'étranger.
 *
 * `buildFallbackBody` : générateur par règles, fonctionne toujours, sans
 * aucune dépendance externe — c'est la base garantie. La variété entre
 * candidats vient d'un choix déterministe de variantes basé sur le profil
 * (même candidat → même texte à la régénération, candidats différents →
 * formulations différentes), pas d'aléatoire.
 *
 * `generateWithOpenAI` : amélioration optionnelle, activée uniquement si
 * OPENAI_API_KEY est configurée ; dégradation gracieuse sinon.
 *
 * Deuxième passe de relecture (retour de l'utilisateur, avec les remarques
 * précises d'un examen ChatGPT d'un exemple réel — Mechatroniker — à
 * l'appui) :
 *   - "Ausbildungsplatz als X" → "Ausbildungsplatz zum/zur X" : la
 *     collocation idiomatique allemande pour une Ausbildung utilise
 *     l'article de genre (zum/zur), pas "als" (voir `germanArticleFor`).
 *   - "in Ihrem Haus" ne sonne naturel que pour un établissement de santé ;
 *     remplacé par "in Ihrem Unternehmen", plus universel.
 *   - "Ich kann die Ausbildung ab sofort beginnen" peut sembler ignorer
 *     une rentrée fixe (les Ausbildung démarrent souvent à date précise,
 *     ex. septembre) — remplacé par une formulation plus flexible
 *     ("nach Absprache") quand aucune date précise n'est donnée.
 *   - Le paragraphe sur l'expérience pratique doit clairement se présenter
 *     comme une première expérience, jamais comme l'équivalent de la
 *     qualification visée.
 */

export { isOpenAiConfigured };

// La plupart des noms de métiers allemands en Ausbildung se terminent en
// "-er" et sont masculins (Mechatroniker, Elektroniker, Techniker...) — le
// masculin sert donc de valeur par défaut, avec détection des suffixes
// explicitement féminins/masculins pour les cas fréquents (Kauffrau,
// Kaufmann, Fachfrau, Fachmann...).
function germanArticleFor(program: string): "zum" | "zur" {
  if (/frau\b/i.test(program)) return "zur";
  if (/mann\b/i.test(program)) return "zum";
  return "zum";
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

function pick<T>(variants: T[], seed: string): T {
  return variants[hashSeed(seed) % variants.length];
}

type ProfessionCategory = "pflege" | "technik" | "kaufmann" | "general";

function categorizeProgram(program: string): ProfessionCategory {
  if (/pflege|gesundheit|kranken|altenpfleg/i.test(program)) return "pflege";
  if (/mechatroniker|elektroniker|elektrik|techniker|handwerk|mechanik|kfz|schlosser|installateur|anlagenmechaniker/i.test(program)) return "technik";
  if (/kaufmann|kauffrau|büromanagement|einzelhandel|verkauf|handel|vertrieb/i.test(program)) return "kaufmann";
  return "general";
}

const PROFESSION_MOTIVATION: Record<ProfessionCategory, string[]> = {
  pflege: [
    "Der Beruf der Pflegefachkraft verbindet fachliches Wissen mit menschlicher Nähe und bietet mir die Möglichkeit, Menschen in schwierigen Situationen kompetent zur Seite zu stehen.",
    "Der direkte Kontakt mit Menschen und die Möglichkeit, sie in schwierigen Lebenssituationen kompetent zu unterstützen, motivieren mich besonders für den Pflegeberuf.",
    "Der verantwortungsvolle Umgang mit Patientinnen und Patienten sowie die Vielseitigkeit des Pflegeberufs entsprechen genau dem, was ich mir für meinen beruflichen Weg wünsche.",
  ],
  technik: [
    "Dieser Beruf verbindet theoretisches Wissen mit praktischem handwerklichem Können und bietet vielseitige Möglichkeiten, mich fachlich und persönlich weiterzuentwickeln.",
    "Besonders reizt mich die Kombination aus Technik, Präzision und praktischer Problemlösung, die diesen Beruf so vielseitig macht.",
    "Die Möglichkeit, technische Zusammenhänge zu verstehen und direkt in der Praxis anzuwenden, motiviert mich besonders für diesen Beruf.",
  ],
  kaufmann: [
    "Dieser Beruf verbindet Organisation, Kommunikation und wirtschaftliches Denken — genau die Kombination, die mich an dieser Ausbildung reizt.",
    "Der direkte Kontakt zu Kolleginnen, Kollegen und Kundinnen sowie die organisatorische Vielfalt dieses Berufs entsprechen genau meinen Stärken.",
    "Ich schätze besonders die Vielseitigkeit dieses Berufsbildes zwischen Organisation, Kommunikation und wirtschaftlichem Denken.",
  ],
  general: [
    "Die praxisnahe Ausrichtung dieser Ausbildung und die Möglichkeit, Theorie und Praxis direkt miteinander zu verbinden, entsprechen genau meinen beruflichen Zielen.",
    "Ich schätze besonders die Vielseitigkeit dieses Berufsbildes und die Aussicht, mich in einem professionellen Umfeld weiterzuentwickeln.",
    "Diese Ausbildung bietet mir die Möglichkeit, meine bisherigen Kenntnisse gezielt auszubauen und langfristig Verantwortung zu übernehmen.",
  ],
};

function availabilityClause(availabilityDate?: string): string {
  if (!availabilityDate || /^(sofort|dès que possible|asap)$/i.test(availabilityDate.trim())) {
    return "Für einen Ausbildungsbeginn stehe ich nach Absprache flexibel zur Verfügung.";
  }
  return `Ich kann die Ausbildung ab ${availabilityDate} beginnen.`;
}

export function buildFallbackBody(data: BewerbungsbriefData): string {
  // `program` reste `undefined` tant que l'utilisateur n'a rien saisi : la
  // collocation "Ausbildungsplatz zum/zur [métier]" exige un vrai nom de
  // métier après l'article de genre (contrairement à "als", qui acceptait
  // n'importe quelle formule de secours). Sans métier précisé, on utilise
  // donc "eine Ausbildungsstelle", une formule neutre qui n'a besoin
  // d'aucun article de genre.
  const program = data.targetProgram?.trim() || undefined;
  const institution = data.recipientInstitution || "Ihrem Unternehmen";
  const seed = `${data.fullName}-${program ?? ""}-${institution}`;

  const positionPhrase = program ? `einen Ausbildungsplatz ${germanArticleFor(program)} ${program}` : "eine Ausbildungsstelle";
  const openings = [
    `mit großem Interesse bewerbe ich mich um ${positionPhrase} bei ${institution}.`,
    `${institution} genießt einen ausgezeichneten Ruf, und ich bewerbe mich daher sehr gerne um ${positionPhrase} in Ihrem Unternehmen.`,
    `mit dieser Bewerbung möchte ich Ihnen mein ernsthaftes Interesse an ${positionPhrase} bei ${institution} darlegen.`,
  ];
  const sourceSentence = data.sourceOfListing ? ` Auf die Ausbildungsstelle bin ich über ${data.sourceOfListing} aufmerksam geworden.` : "";
  const professionSentence = pick(PROFESSION_MOTIVATION[categorizeProgram(program ?? "")], seed);
  const paragraph1 = `${pick(openings, seed)}${sourceSentence} ${professionSentence}`;

  // Le formulaire démarre avec une ligne d'attestation vide (voir
  // BewerbungsbriefEditor.tsx) : filtrer les entrées sans intitulé pour
  // éviter un paragraphe du type "Im Rahmen von  konnte ich..." (espace
  // vide) quand l'utilisateur génère avant d'avoir rempli une attestation.
  const filledQualifications = data.qualifications.filter((q) => q.title.trim());
  let paragraph2 = "";
  if (filledQualifications.length > 0) {
    const quals = filledQualifications
      .map((q) => `${q.title}${q.institution ? ` an ${q.institution}` : ""}${q.date ? ` (${q.date})` : ""}`)
      .join(", ");
    const traits = pick(
      [
        "sorgfältig, zuverlässig und verantwortungsbewusst zu arbeiten",
        "selbstständig, genau und im Team zu arbeiten",
        "strukturiert vorzugehen und auch unter Zeitdruck zuverlässig zu bleiben",
      ],
      `${seed}-traits`,
    );
    paragraph2 = `Im Rahmen von ${quals} konnte ich bereits erste praktische Kenntnisse in diesem Bereich sammeln. Dabei habe ich gelernt, ${traits}.`;
  }

  const languageSentence = data.languageLevel
    ? `Mein Deutsch auf dem Niveau ${data.languageLevel} ermöglicht es mir bereits, mich im beruflichen Alltag gut zu verständigen. Gleichzeitig arbeite ich kontinuierlich daran, meine Deutschkenntnisse weiter zu verbessern.`
    : "";

  // Un employeur qui recrute à l'étranger a besoin d'être rassuré sur
  // l'engagement du candidat (risque d'abandon en cours de formation).
  const paragraph4 = `Für diese Ausbildung bin ich bereit, nach Deutschland umzuziehen. Ich habe mich bereits mit den notwendigen Schritten für einen Ausbildungsbeginn in Deutschland beschäftigt und bin sehr motiviert, die Ausbildung erfolgreich abzuschließen und langfristig als ${program ?? "Fachkraft"} in Deutschland zu arbeiten.`;

  const motivationNotes = data.motivationNotes?.trim() || "";

  const valueSummaries = [
    `Eine Ausbildungsstelle bei Ihnen wäre für mich eine hervorragende Gelegenheit, meine bisherigen Kenntnisse weiterzuentwickeln, neue Fähigkeiten zu erwerben und mich engagiert in Ihr Team einzubringen.`,
    `Eine Ausbildungsstelle in Ihrem Unternehmen würde mir die Möglichkeit geben, meine Fähigkeiten gezielt weiterzuentwickeln und von Beginn an einen echten Beitrag zu leisten.`,
    `Ich wäre stolz darauf, meine Ausbildung in Ihrem Unternehmen zu absolvieren und mit Engagement zum Erfolg Ihres Teams beizutragen.`,
  ];
  const paragraph6 = pick(valueSummaries, `${seed}-value`);

  const closings = [
    "Über die Einladung zu einem persönlichen Gespräch oder einem Online-Interview würde ich mich sehr freuen.",
    "Gerne überzeuge ich Sie in einem persönlichen Gespräch oder einem Online-Interview von meiner Motivation und Eignung.",
    "Ich freue mich darauf, Ihnen meine Motivation in einem persönlichen Gespräch oder einem Online-Interview näher darzulegen.",
  ];
  const paragraph7 = `${pick(closings, `${seed}-closing`)} ${availabilityClause(data.availabilityDate)}`;

  return [paragraph1, paragraph2, languageSentence, paragraph4, motivationNotes, paragraph6, paragraph7]
    .filter(Boolean)
    .join("\n\n");
}

export async function generateWithOpenAI(data: BewerbungsbriefData): Promise<{ text: string } | { error: string }> {
  const prompt = [
    "Tu es un rédacteur professionnel spécialisé dans les Bewerbungsschreiben (lettres de motivation allemandes) pour les formations Ausbildung — en particulier Pflege et les métiers techniques — à destination de candidats internationaux qui immigrent en Allemagne pour cette formation.",
    "Le texte doit se lire comme rédigé par un être humain, un expert de la candidature — jamais comme un modèle rempli automatiquement. Découpe le texte en plusieurs paragraphes courts (une idée par paragraphe : accroche, expérience concrète, motivation pour le métier + niveau d'allemand, installation en Allemagne, valeur ajoutée, demande d'entretien), jamais un seul bloc dense.",
    "Rédige uniquement le corps (Einleitung, Hauptteil, Schluss — sans en-tête, sans Anrede, sans Grußformel, sans Anlagen), en allemand, ton formel mais naturel, 250 à 350 mots, sans aucune faute.",
    "Consignes impératives : ne commence surtout pas par 'Hiermit bewerbe ich mich' (cliché à éviter) ; utilise 'Ausbildungsplatz zum/zur [métier]' (jamais 'als [métier]' pour cette collocation précise) et accorde correctement zum/zur au genre du métier ; dis 'in Ihrem Unternehmen', jamais 'in Ihrem Haus' (sauf s'il s'agit réellement d'un établissement de santé) ; adapte la motivation au métier précis visé (pour la Pflege : contact humain et accompagnement des patients ; pour un métier technique comme Mechatroniker : combinaison de mécanique/électronique et résolution pratique de problèmes) ; pour l'expérience/les qualifications, ne te contente jamais d'une formule passe-partout du type 'cela m'a bien préparé aux exigences du poste' — tire un enseignement concret (une qualité apprise) de cette expérience, et présente-la clairement comme une PREMIÈRE expérience pratique, jamais comme l'équivalent de la qualification visée (ex. un stage en garage automobile n'équivaut pas à une formation de Mechatroniker) ; si aucune date de disponibilité précise n'est donnée, ne dis pas 'ab sofort' (une Ausbildung a souvent une rentrée fixe) — préfère une formulation flexible du type 'nach Absprache' ; reste concis sur les démarches d'installation (visa, reconnaissance) pour laisser plus de place à la motivation et aux compétences pratiques ; propose explicitement un entretien en présentiel OU en ligne (candidat à l'étranger) ; n'invente aucune information non fournie ci-dessous.",
    `Poste/formation visé(e) : ${data.targetProgram || "non précisé"}`,
    `Établissement destinataire : ${data.recipientInstitution || "non précisé"}`,
    `Source de l'annonce : ${data.sourceOfListing || "non précisée"}`,
    `Qualifications/attestations : ${
      data.qualifications
        .filter((q) => q.title.trim())
        .map((q) => `${q.title} (${q.institution}, ${q.date})`)
        .join("; ") || "aucune renseignée"
    }`,
    `Niveau d'allemand : ${data.languageLevel || "non précisé"}`,
    `Disponibilité : ${data.availabilityDate || "dès que possible"}`,
    `Notes de motivation de la personne : ${data.motivationNotes || "aucune"}`,
  ].join("\n");

  return callOpenAiChat(prompt);
}
