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

/**
 * Formulations grammaticalement justes pour la formation visée, quelle que
 * soit la façon dont le client l'a saisie (troisième relecture, 2026-09-29 :
 * « Ausbildungsplatz zum Pflegefachkraft », « zum Pflege », « als Pflege
 * arbeiten » étaient produits).
 *   - un métier masculin (Mechatroniker, Pflegefachmann, Kaufmann…) : « zum » ;
 *   - un métier féminin (Pflegefachkraft, Pflegefachfrau, Erzieherin…) : « zur » ;
 *   - un domaine (Pflege, Altenpflege, Gastronomie, Logistik…) : « in der »,
 *     ou « im » (Einzelhandel, Gesundheitswesen) — et « als Fachkraft in der
 *     Pflege » plutôt que « als Pflege ».
 */
interface ProgramWording {
  /** Accusatif : « bewerbe mich um … ». */
  position: string;
  /** Datif : « Interesse an … ». */
  positionDative: string;
  /** « … in Deutschland zu arbeiten » : « als Pflegefachfrau », « als Fachkraft in der Pflege ». */
  futureRole: string;
}

function cleanProgram(raw: string): string {
  return raw
    .replace(/\((?:m|w|d|f)(?:\s*\/\s*(?:m|w|d|f))*\)/gi, "") // « (m/w/d) »
    .replace(/^\s*(?:eine?n?\s+)?ausbildung(?:splatz|sstelle)?\s+(?:zum|zur|als|in der|im)\s+/i, "") // « Ausbildung zur … »
    .replace(/\s+/g, " ")
    .trim();
}

export function describeProgram(rawProgram: string | undefined): ProgramWording {
  const program = rawProgram ? cleanProgram(rawProgram) : "";
  if (!program) {
    return { position: "eine Ausbildungsstelle", positionDative: "einer Ausbildungsstelle", futureRole: "als Fachkraft" };
  }
  // Mot principal : avant « für »/« im »/« in der » (« Kaufmann für
  // Büromanagement », « Kauffrau im Einzelhandel »), le dernier mot
  // (« Gesundheits- und Krankenpflege »), avant une barre oblique
  // (« Pflegefachmann/-frau »).
  const head = program.split(/\s+(?:für|im|in|bei)\s+/i)[0];
  const lastWord = head.split(/\s+/).pop()!;
  const main = lastWord.split("/")[0];
  // « Pflegefachmann/-frau », « Kaufmann/-frau » : formule des annonces allemandes.
  if (/mann\/-?\s*frau/i.test(lastWord) || /frau\/-?\s*mann/i.test(lastWord)) {
    return { position: `einen Ausbildungsplatz zum/zur ${program}`, positionDative: `einem Ausbildungsplatz zum/zur ${program}`, futureRole: `als ${program}` };
  }
  // Domaine plutôt que métier.
  if (/(?:wesen|bereich|handel|dienst)$/i.test(main)) {
    return { position: `einen Ausbildungsplatz im ${program}`, positionDative: `einem Ausbildungsplatz im ${program}`, futureRole: `als Fachkraft im ${program}` };
  }
  if (/(?:pflege|ung|ie|ik|logistik|gastronomie|hotellerie)$/i.test(main) && !/(?:kraft|frau|mann|er|in)$/i.test(main)) {
    return { position: `einen Ausbildungsplatz in der ${program}`, positionDative: `einem Ausbildungsplatz in der ${program}`, futureRole: `als Fachkraft in der ${program}` };
  }
  const article = /(?:frau|kraft|in)$/i.test(main) && !/mann$/i.test(main) ? "zur" : "zum";
  return {
    position: `einen Ausbildungsplatz ${article} ${program}`,
    positionDative: `einem Ausbildungsplatz ${article} ${program}`,
    futureRole: `als ${program}`,
  };
}

const GERMAN_MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** « 09/2027 » → « September 2027 » (sinon la valeur telle quelle). */
function germanMonthYear(value: string): string {
  const m = value.trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return value.trim();
  return `${GERMAN_MONTHS[Number(m[1]) - 1]} ${m[2]}`;
}

/** Phrase sur l'allemand, fidèle au niveau réellement indiqué (A1 → C2). */
function languageSentence(level: string | undefined): string {
  const raw = (level ?? "").trim();
  if (!raw) return "";
  const cefr = raw.toUpperCase().match(/\b([ABC][12])\b/)?.[1];
  if (cefr === "A1" || cefr === "A2") {
    return `Derzeit verfüge ich über Deutschkenntnisse auf dem Niveau ${raw} und lerne intensiv weiter, um das für die Ausbildung erforderliche Sprachniveau zu erreichen.`;
  }
  if (cefr === "B1") {
    return `Meine Deutschkenntnisse auf dem Niveau ${raw} ermöglichen es mir, mich im Alltag sicher zu verständigen. Ich arbeite kontinuierlich daran, sie weiter auszubauen, insbesondere im Hinblick auf die Fachsprache.`;
  }
  if (cefr === "C1" || cefr === "C2") {
    return `Dank meiner Deutschkenntnisse auf dem Niveau ${raw} kann ich mich auch in anspruchsvollen beruflichen Situationen sicher und präzise ausdrücken.`;
  }
  return `Meine Deutschkenntnisse auf dem Niveau ${raw} ermöglichen es mir, mich im beruflichen Alltag gut zu verständigen. Gleichzeitig arbeite ich kontinuierlich daran, meine Fachsprache weiter zu verbessern.`;
}

/** « a, b und c ». */
function germanList(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
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
  return `Die Ausbildung könnte ich ab ${germanMonthYear(availabilityDate)} beginnen.`;
}

/**
 * Corps de la lettre par règles. Principe de la troisième relecture
 * (2026-09-29) : une information saisie par le client n'est jamais insérée
 * à un endroit où la grammaire allemande exigerait un article ou un cas
 * qu'on ne peut pas deviner (« bei Universitätsklinikum Köln », « Im
 * Rahmen von Praktikum »). Le nom de l'établissement figure déjà dans
 * l'adresse du destinataire ; les attestations sont présentées en liste.
 */
export function buildFallbackBody(data: BewerbungsbriefData): string {
  const program = data.targetProgram?.trim() || "";
  const wording = describeProgram(program);
  const category = categorizeProgram(program);
  const seed = `${data.fullName}-${program}-${data.recipientInstitution ?? ""}`;
  // Un hôpital ou une maison de retraite est une « Einrichtung », pas une entreprise.
  const workplace = category === "pflege" ? "Ihrer Einrichtung" : "Ihrem Unternehmen";

  const openings = [
    `mit großem Interesse bewerbe ich mich bei Ihnen um ${wording.position}.`,
    `mit dieser Bewerbung möchte ich Ihnen mein ernsthaftes Interesse an ${wording.positionDative} in ${workplace} zeigen.`,
    `sehr gerne bewerbe ich mich bei Ihnen um ${wording.position}, denn ich möchte meine berufliche Zukunft in Deutschland aufbauen.`,
  ];
  const source = data.sourceOfListing?.trim();
  const sourceSentence = source ? ` Auf Ihre Ausschreibung bin ich über ${source} aufmerksam geworden.` : "";
  const professionSentence = pick(PROFESSION_MOTIVATION[category], seed);
  const paragraph1 = `${pick(openings, seed)}${sourceSentence} ${professionSentence}`;

  // Le formulaire démarre avec une ligne d'attestation vide : on ignore les
  // entrées sans intitulé.
  const filledQualifications = data.qualifications.filter((q) => q.title.trim());
  let paragraph2 = "";
  if (filledQualifications.length > 0) {
    const items = filledQualifications.map((q) => {
      const details = [q.institution?.trim(), q.date?.trim() ? germanMonthYear(q.date) : ""].filter(Boolean).join(", ");
      return details ? `${q.title.trim()} (${details})` : q.title.trim();
    });
    const traits = pick(
      [
        "sorgfältig, zuverlässig und verantwortungsbewusst zu arbeiten",
        "selbstständig, genau und im Team zu arbeiten",
        "strukturiert vorzugehen und auch unter Zeitdruck zuverlässig zu bleiben",
      ],
      `${seed}-traits`,
    );
    const intro = filledQualifications.length === 1 ? "Eine erste praktische Erfahrung bringe ich bereits mit:" : "Folgende erste Erfahrungen und Qualifikationen bringe ich bereits mit:";
    paragraph2 = `${intro} ${germanList(items)}. Dabei habe ich gelernt, ${traits}.`;
  }

  const languageParagraph = languageSentence(data.languageLevel);

  // Un employeur qui recrute à l'étranger a besoin d'être rassuré sur
  // l'engagement du candidat (risque d'abandon en cours de formation).
  const paragraph4 = `Für diese Ausbildung bin ich bereit, nach Deutschland umzuziehen. Ich habe mich bereits mit den notwendigen Schritten für einen Ausbildungsbeginn in Deutschland beschäftigt und bin sehr motiviert, die Ausbildung erfolgreich abzuschließen und langfristig ${wording.futureRole} in Deutschland zu arbeiten.`;

  // Notes du client, en allemand (vérifié en amont : des notes rédigées dans
  // une autre langue ne sont pas insérées — voir generate-actions.ts).
  const motivationNotes = data.motivationNotes?.trim() || "";

  const valueSummaries = [
    `Eine Ausbildungsstelle bei Ihnen wäre für mich eine hervorragende Gelegenheit, meine bisherigen Kenntnisse weiterzuentwickeln, neue Fähigkeiten zu erwerben und mich engagiert in Ihr Team einzubringen.`,
    `Eine Ausbildung in ${workplace} würde mir die Möglichkeit geben, meine Fähigkeiten gezielt weiterzuentwickeln und von Beginn an einen echten Beitrag zu leisten.`,
    `Ich wäre stolz darauf, meine Ausbildung in ${workplace} zu absolvieren und mit Engagement zum Erfolg Ihres Teams beizutragen.`,
  ];
  const paragraph6 = pick(valueSummaries, `${seed}-value`);

  const closings = [
    "Über die Einladung zu einem persönlichen Gespräch oder einem Online-Interview würde ich mich sehr freuen.",
    "Gerne überzeuge ich Sie in einem persönlichen Gespräch oder einem Online-Interview von meiner Motivation und Eignung.",
    "Ich freue mich darauf, Ihnen meine Motivation in einem persönlichen Gespräch oder einem Online-Interview näher darzulegen.",
  ];
  const paragraph7 = `${pick(closings, `${seed}-closing`)} ${availabilityClause(data.availabilityDate)}`;

  // Les notes du client suivent ses expériences : c'est là qu'une anecdote
  // ou une précision personnelle prend son sens.
  return [paragraph1, paragraph2, motivationNotes, languageParagraph, paragraph4, paragraph6, paragraph7]
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
