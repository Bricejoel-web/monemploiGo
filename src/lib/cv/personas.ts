import type { CvData } from "./types";
import type { Locale } from "@/i18n/config";
import type { PortraitGroup } from "@/lib/photos/unsplash";

// Bassin de profils fictifs utilisés pour les APERÇUS du catalogue
// uniquement (chaque modèle affiche une personne différente, avec un nom
// unique qui correspond au genre de la photo affichée). Le contenu réel du
// CV de l'utilisateur reste entièrement le sien, saisi dans l'éditeur.

export type Gender = "M" | "F";
export type Ethnicity = "africain" | "europeen";

export function genderOfPortraitGroup(group: PortraitGroup): Gender {
  return group.startsWith("homme_") ? "M" : "F";
}

export function ethnicityOfPortraitGroup(group: PortraitGroup): Ethnicity {
  // Les personnes métisses reçoivent un nom africain : le site cible avant
  // tout l'Afrique francophone et anglophone (voir la remarque de
  // l'utilisateur sur la majorité noire/métisse du bassin de photos).
  return group === "homme_blanc" || group === "femme_blanche" ? "europeen" : "africain";
}

type PersonaContent = Omit<CvData, "fullName">;

interface GenderedPersonaContent {
  gender: Gender;
  content: PersonaContent;
}

const contentFr: GenderedPersonaContent[] = [
  {
    gender: "F",
    content: {
      jobTitle: "Comptable",
      email: "contact@email.com",
      phone: "+225 07 XX XX XX XX",
      address: "Abidjan, Côte d'Ivoire",
      summary: "Comptable rigoureuse et organisée, 4 ans d'expérience en tenue de comptabilité générale et en gestion de la trésorerie de PME.",
      photoDataUrl: null,
      experience: [
        { role: "Comptable", company: "Groupe Sika", location: "Abidjan", start: "2022", end: "présent", description: "Tenue de la comptabilité générale, déclarations fiscales mensuelles, rapprochements bancaires." },
        { role: "Assistante comptable", company: "Cabinet Fiscia", location: "Abidjan", start: "2020", end: "2022", description: "Saisie comptable, suivi des factures fournisseurs, préparation des bilans annuels." },
      ],
      education: [{ degree: "BTS Comptabilité et Gestion", school: "Institut Supérieur de Commerce", start: "2018", end: "2020" }],
      skills: ["Sage Compta", "Excel avancé", "Fiscalité", "Rigueur"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Notions" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Infirmière diplômée d'État",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Infirmière diplômée, 3 ans d'expérience en service de médecine générale, reconnue pour son sens de l'écoute et son calme en situation d'urgence.",
      photoDataUrl: null,
      experience: [
        { role: "Infirmière", company: "Hôpital Général de Douala", location: "Douala", start: "2022", end: "présent", description: "Soins infirmiers, surveillance des constantes, coordination avec l'équipe médicale sur 40 lits." },
        { role: "Infirmière stagiaire", company: "Clinique Bonanjo", location: "Douala", start: "2021", end: "2022", description: "Accompagnement des patients, gestion des dossiers médicaux." },
      ],
      education: [{ degree: "Diplôme d'État Infirmier", school: "École des Sciences de la Santé", start: "2018", end: "2021" }],
      skills: ["Soins infirmiers", "Gestion de crise", "Travail d'équipe", "Rigueur médicale"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Intermédiaire" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Chargée de communication",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Yaoundé, Cameroun",
      summary: "Chargée de communication passionnée, expertise en gestion de projets, création de contenus et animation de communautés en ligne.",
      photoDataUrl: null,
      experience: [
        { role: "Chargée de communication", company: "Rimberio", location: "Yaoundé", start: "2022", end: "présent", description: "Gestion de la stratégie de communication interne, création de supports print et digital, relations presse." },
        { role: "Chargée de communication digitale", company: "Borcelle", location: "Yaoundé", start: "2020", end: "2022", description: "Conception de campagnes digitales, animation des communautés en ligne." },
      ],
      education: [{ degree: "Master en Communication et Stratégies Digitales", school: "École de Communication", start: "2018", end: "2020" }],
      skills: ["Gestion de projet", "Création de contenu", "Réseaux sociaux", "Référencement"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }, { name: "Espagnol", level: "Notions" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Assistante de direction",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Yaoundé, Cameroun",
      summary: "Assistante de direction polyvalente, sens de l'organisation reconnu, 6 ans d'expérience dans l'accompagnement de dirigeants.",
      photoDataUrl: null,
      experience: [
        { role: "Assistante de direction", company: "Groupe Fokou", location: "Yaoundé", start: "2019", end: "présent", description: "Gestion de l'agenda de la direction générale, organisation des déplacements et des réunions." },
        { role: "Secrétaire administrative", company: "Chanas Assurances", location: "Yaoundé", start: "2016", end: "2019", description: "Accueil, gestion du courrier et des dossiers administratifs." },
      ],
      education: [{ degree: "BTS Assistanat de Direction", school: "Institut Siantou", start: "2014", end: "2016" }],
      skills: ["Organisation", "Discrétion", "Microsoft Office", "Gestion d'agenda"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Intermédiaire" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Responsable ressources humaines",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Responsable RH avec 7 ans d'expérience en recrutement, gestion administrative du personnel et développement des compétences.",
      photoDataUrl: null,
      experience: [
        { role: "Responsable RH", company: "Bolloré Transport & Logistics", location: "Douala", start: "2020", end: "présent", description: "Pilotage du recrutement, gestion des contrats et des relations sociales pour 150 employés." },
        { role: "Chargée de recrutement", company: "Adecco", location: "Douala", start: "2017", end: "2020", description: "Sourcing, entretiens et intégration des nouveaux collaborateurs." },
      ],
      education: [{ degree: "Master en Gestion des Ressources Humaines", school: "Université de Douala", start: "2015", end: "2017" }],
      skills: ["Recrutement", "Droit du travail", "Gestion des conflits", "SIRH"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Juriste d'entreprise",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Yaoundé, Cameroun",
      summary: "Juriste d'entreprise spécialisée en droit des affaires, 4 ans d'expérience en conseil juridique et en rédaction de contrats.",
      photoDataUrl: null,
      experience: [
        { role: "Juriste d'entreprise", company: "MTN Cameroun", location: "Yaoundé", start: "2021", end: "présent", description: "Rédaction et négociation de contrats commerciaux, veille juridique et réglementaire." },
        { role: "Assistante juridique", company: "Cabinet Akere Muna", location: "Yaoundé", start: "2019", end: "2021", description: "Recherche juridique, suivi de dossiers contentieux." },
      ],
      education: [{ degree: "Master en Droit des Affaires", school: "Université de Yaoundé II", start: "2017", end: "2019" }],
      skills: ["Droit des affaires", "Négociation de contrats", "Veille juridique", "Rédaction"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Graphiste créative & Marketing digital",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Graphiste créative avec plus de 5 ans d'expérience en design visuel pour le digital et l'imprimé, spécialisée en identité de marque.",
      photoDataUrl: null,
      experience: [
        { role: "Graphiste / Designeuse", company: "Ginyerd International Co.", location: "Douala", start: "2020", end: "présent", description: "Création de contenus visuels pour startups, gestion de campagnes de marque." },
        { role: "Graphiste", company: "Giggling Platypus Co.", location: "Douala", start: "2015", end: "2020", description: "Création graphique, collaboration avec les équipes marketing." },
      ],
      education: [{ degree: "Licence en Design Graphique", school: "École de Design", start: "2020", end: "2025" }],
      skills: ["Photoshop", "Illustrator", "Identité de marque", "Événementiel"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Développeur web",
      email: "contact@email.com",
      phone: "+221 77 XX XX XX",
      address: "Dakar, Sénégal",
      summary: "Développeur web autodidacte devenu professionnel, spécialisé dans la création de sites et applications pour petites entreprises.",
      photoDataUrl: null,
      experience: [
        { role: "Développeur web freelance", company: "Indépendant", location: "Dakar", start: "2021", end: "présent", description: "Conception de sites vitrines et e-commerce pour une dizaine de clients locaux." },
        { role: "Développeur junior", company: "Wave Digital", location: "Dakar", start: "2020", end: "2021", description: "Intégration de maquettes, maintenance d'applications internes." },
      ],
      education: [{ degree: "Licence en Informatique", school: "Université Cheikh Anta Diop", start: "2017", end: "2020" }],
      skills: ["JavaScript", "React", "WordPress", "Gestion de projet"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Commercial B2B",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Commercial dynamique, 5 ans d'expérience en développement de portefeuille client dans le secteur agroalimentaire.",
      photoDataUrl: null,
      experience: [
        { role: "Chargé d'affaires commerciales", company: "Sodecoton", location: "Douala", start: "2021", end: "présent", description: "Prospection et développement d'un portefeuille de 60 clients grossistes." },
        { role: "Commercial terrain", company: "Nestlé Cameroun", location: "Douala", start: "2019", end: "2021", description: "Suivi de la distribution en zone urbaine, animation des points de vente." },
      ],
      education: [{ degree: "BTS Action Commerciale", school: "Institut Universitaire de Douala", start: "2017", end: "2019" }],
      skills: ["Négociation", "Prospection", "CRM", "Relation client"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Intermédiaire" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Assistant comptable",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Jeune diplômé motivé, à la recherche d'une première expérience en comptabilité, reconnu pour sa rigueur et son sens du détail.",
      photoDataUrl: null,
      experience: [
        { role: "Stagiaire comptable", company: "Cabinet Fiscia", location: "Douala", start: "2023", end: "2023", description: "Saisie comptable et classement des pièces justificatives." },
      ],
      education: [{ degree: "BTS Comptabilité et Gestion", school: "Institut Universitaire de Douala", start: "2021", end: "2023" }],
      skills: ["Excel", "Rigueur", "Sage Compta"],
      languages: [{ name: "Français", level: "Langue maternelle" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Ingénieur en logistique",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Ingénieur logistique orienté résultats, expérience dans l'optimisation des chaînes d'approvisionnement portuaires.",
      photoDataUrl: null,
      experience: [
        { role: "Ingénieur logistique", company: "APM Terminals", location: "Douala", start: "2021", end: "présent", description: "Optimisation des flux de conteneurs, réduction de 15% des délais de traitement." },
        { role: "Ingénieur logistique junior", company: "Bolloré Africa Logistics", location: "Douala", start: "2019", end: "2021", description: "Suivi des opérations de transit et de dédouanement." },
      ],
      education: [{ degree: "Diplôme d'Ingénieur en Logistique", school: "Institut Supérieur de Technologie", start: "2016", end: "2019" }],
      skills: ["Supply Chain", "SAP", "Gestion de stock", "Amélioration continue"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Professeur d'Histoire-Géographie",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Bafang, Cameroun",
      summary: "Enseignant passionné et rigoureux, fort de 3 ans d'expérience dans l'encadrement pédagogique d'élèves de la 6e à la 3e.",
      photoDataUrl: null,
      experience: [
        { role: "Professeur d'Histoire-Géographie", company: "Collège Pascal Tchoua", location: "Bafang", start: "2022", end: "2023", description: "Enseignement du programme officiel à 4 classes. Supports pédagogiques différenciés et suivi individualisé des élèves en difficulté." },
        { role: "Professeur vacataire", company: "Collège Bilingue La Semence", location: "Bafang", start: "2021", end: "2022", description: "Encadrement de classes de 5e et 4e, ateliers de soutien scolaire le samedi." },
      ],
      education: [{ degree: "Licence d'Histoire (en cours)", school: "Université de Dschang", start: "2021", end: "présent" }],
      skills: ["Pédagogie différenciée", "Gestion de classe", "Microsoft Office", "Évaluation formative"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Intermédiaire" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Graphiste créatif & Marketing digital",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      summary: "Graphiste créatif avec plus de 5 ans d'expérience en design visuel pour le digital et l'imprimé, spécialisé en identité de marque.",
      photoDataUrl: null,
      experience: [
        { role: "Graphiste / Designer", company: "Ginyerd International Co.", location: "Douala", start: "2020", end: "présent", description: "Création de contenus visuels pour startups, gestion de campagnes de marque." },
        { role: "Graphiste", company: "Giggling Platypus Co.", location: "Douala", start: "2015", end: "2020", description: "Création graphique, collaboration avec les équipes marketing." },
      ],
      education: [{ degree: "Licence en Design Graphique", school: "École de Design", start: "2020", end: "2025" }],
      skills: ["Photoshop", "Illustrator", "Identité de marque", "Événementiel"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "Courant" }],
    },
  },
];

const contentEn: GenderedPersonaContent[] = [
  {
    gender: "F",
    content: {
      jobTitle: "Administrative Assistant",
      email: "contact@email.com",
      phone: "+234 800 000 0000",
      address: "Lagos, Nigeria",
      summary: "Organized and detail-oriented professional with 4 years of experience in administrative management.",
      photoDataUrl: null,
      experience: [
        { role: "Administrative Assistant", company: "Sika Group", location: "Lagos", start: "2022", end: "Present", description: "Managed client files, coordinated schedules and tracked budgets." },
        { role: "Front Desk Officer", company: "Ivoire Hotel", location: "Lagos", start: "2020", end: "2022", description: "Handled guest reception and reservations." },
      ],
      education: [{ degree: "BSc Business Administration", school: "Lagos Business School", start: "2018", end: "2020" }],
      skills: ["Administrative management", "Microsoft Office", "Customer service", "Organization"],
      languages: [{ name: "English", level: "Native" }, { name: "French", level: "Intermediate" }],
    },
  },
  {
    gender: "F",
    content: {
      jobTitle: "Registered Nurse",
      email: "contact@email.com",
      phone: "+254 700 000 000",
      address: "Nairobi, Kenya",
      summary: "Compassionate registered nurse with 3 years of experience in general medicine wards.",
      photoDataUrl: null,
      experience: [
        { role: "Registered Nurse", company: "Nairobi General Hospital", location: "Nairobi", start: "2022", end: "Present", description: "Provided patient care and coordinated with the medical team on a 40-bed ward." },
        { role: "Nurse Intern", company: "Aga Khan Clinic", location: "Nairobi", start: "2021", end: "2022", description: "Assisted with patient monitoring and medical records." },
      ],
      education: [{ degree: "Diploma in Nursing", school: "Kenya Medical Training College", start: "2018", end: "2021" }],
      skills: ["Patient care", "Crisis management", "Teamwork", "Medical precision"],
      languages: [{ name: "English", level: "Native" }, { name: "Swahili", level: "Native" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Marketing Executive",
      email: "contact@email.com",
      phone: "+233 24 000 0000",
      address: "Accra, Ghana",
      summary: "Results-driven marketing executive with a track record of growing brand awareness for consumer goods companies.",
      photoDataUrl: null,
      experience: [
        { role: "Marketing Executive", company: "Unilever Ghana", location: "Accra", start: "2021", end: "Present", description: "Led digital campaigns that increased brand engagement by 30%." },
        { role: "Marketing Assistant", company: "MTN Ghana", location: "Accra", start: "2019", end: "2021", description: "Supported campaign planning and social media management." },
      ],
      education: [{ degree: "BA Marketing", school: "University of Ghana", start: "2016", end: "2019" }],
      skills: ["Digital marketing", "Brand strategy", "Content creation", "Analytics"],
      languages: [{ name: "English", level: "Native" }],
    },
  },
  {
    gender: "M",
    content: {
      jobTitle: "Software Developer",
      email: "contact@email.com",
      phone: "+233 20 000 0000",
      address: "Kumasi, Ghana",
      summary: "Self-taught software developer turned professional, focused on building web applications for small businesses.",
      photoDataUrl: null,
      experience: [
        { role: "Freelance Web Developer", company: "Self-employed", location: "Kumasi", start: "2021", end: "Present", description: "Designed and built e-commerce and showcase websites for a dozen local clients." },
        { role: "Junior Developer", company: "Wave Digital", location: "Kumasi", start: "2020", end: "2021", description: "Implemented UI designs and maintained internal applications." },
      ],
      education: [{ degree: "BSc Computer Science", school: "KNUST", start: "2017", end: "2020" }],
      skills: ["JavaScript", "React", "WordPress", "Project management"],
      languages: [{ name: "English", level: "Native" }],
    },
  },
];

// Bassins de prénoms/noms — larges pour garantir un nom unique par modèle,
// séparés par origine pour que le nom corresponde à l'apparence de la photo
// affichée (photo d'une personne noire → nom africain, photo d'une personne
// blanche → nom européen), sans confusion de genre.
const namesFr: Record<Ethnicity, { first: Record<Gender, string[]>; last: string[] }> = {
  africain: {
    first: {
      M: ["Moussa", "Kevin", "Steve", "Junior", "Emmanuel", "Patrick", "Yannick", "Cédric", "Franck", "Hervé", "Bertrand", "Aristide", "Landry", "Blaise", "Serge"],
      F: ["Aïcha", "Aminata", "Célia", "Nadège", "Grace", "Larissa", "Fatou", "Rachel", "Sandrine", "Vanessa", "Carine", "Odile", "Prisca", "Solange", "Chantal"],
    },
    last: ["Koffi", "Diallo", "Naudin", "Mbarga", "Fouda", "Ngo Bell", "Mbia", "Talla", "Ateba", "Nkolo", "Kamdem", "Simo", "Wandji", "Ekani", "Bello", "Tchoua", "Njike", "Fokou", "Meka", "Assiga"],
  },
  europeen: {
    first: {
      M: ["Thomas", "Nicolas", "Julien", "Antoine", "Pierre", "Alexandre", "Vincent", "Mathieu", "Sébastien", "Laurent", "Olivier", "Guillaume", "Baptiste", "Adrien", "Simon"],
      F: ["Sophie", "Claire", "Camille", "Emma", "Julie", "Marion", "Charlotte", "Élise", "Laura", "Manon", "Aurélie", "Pauline", "Sarah", "Émilie", "Léa"],
    },
    last: ["Dubois", "Lefèvre", "Moreau", "Girard", "Bernard", "Petit", "Roux", "Fontaine", "Lambert", "Rousseau", "Simon", "Michel", "Leroy", "Fournier", "Mercier", "Blanc", "Guérin", "Muller", "Faure", "André"],
  },
};

const namesEn: Record<Ethnicity, { first: Record<Gender, string[]>; last: string[] }> = {
  africain: {
    first: {
      M: ["David", "Samuel", "Daniel", "Joseph", "Michael", "Kwame", "Emmanuel", "Peter"],
      F: ["Amara", "Grace", "Ruth", "Esther", "Blessing", "Patience", "Comfort", "Joy"],
    },
    last: ["Okafor", "Mensah", "Wanjiru", "Owusu", "Adeyemi", "Asante", "Nwosu", "Boateng", "Chukwu", "Osei"],
  },
  europeen: {
    first: {
      M: ["James", "Daniel", "Thomas", "Andrew", "Matthew", "Christopher", "Robert", "William"],
      F: ["Emily", "Sarah", "Laura", "Emma", "Rachel", "Sophie", "Hannah", "Charlotte"],
    },
    last: ["Smith", "Johnson", "Williams", "Brown", "Taylor", "Wilson", "Clark", "Anderson", "Walker", "Harris"],
  },
};

function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function buildName(seed: string, gender: Gender, ethnicity: Ethnicity, locale: Locale): string {
  const pool = locale === "en" ? namesEn : namesFr;
  const { first, last } = pool[ethnicity];
  const firstName = first[gender][seedFromString(`${seed}:first`) % first[gender].length];
  const lastName = last[seedFromString(`${seed}:last`) % last.length];
  return `${firstName} ${lastName}`;
}

/** Choisit un profil dont le genre correspond à la photo affichée, avec un
 * nom unique (rarissime de tomber sur la même combinaison deux fois) et une
 * origine du nom (africaine/européenne) qui correspond à l'apparence de la
 * photo affichée. */
export function pickPersona(locale: Locale, seed: string, gender: Gender, ethnicity: Ethnicity): CvData {
  const pool = locale === "en" ? contentEn : contentFr;
  const sameGender = pool.filter((p) => p.gender === gender);
  const chosen = sameGender[seedFromString(seed) % sameGender.length];
  const fullName = buildName(seed, gender, ethnicity, locale);
  return { ...chosen.content, fullName };
}

// Profils dédiés à la catégorie Allemagne (candidatures de formation
// professionnelle — Ausbildung — notamment en soins infirmiers). Les
// intitulés restent en allemand (voir docs/ROADMAP.md).
const germanContent: Record<Gender, PersonaContent> = {
  F: {
    jobTitle: "Bewerbung um einen Ausbildungsplatz als Pflegefachkraft",
    email: "contact@email.com",
    phone: "+237 6 XX XX XX XX",
    address: "Douala, Kamerun",
    birthDate: "14.03.2003",
    birthPlace: "Douala",
    nationality: "Kamerunisch",
    summary: "",
    photoDataUrl: null,
    experience: [
      { role: "Pflegehelferin", company: "Hôpital Général de Douala", location: "Douala", start: "08.2022", end: "heute", description: "Unterstützung bei der Grundpflege, Vitalzeichenkontrolle und Dokumentation." },
      { role: "Praktikantin Krankenpflege", company: "Clinique Bonanjo", location: "Douala", start: "01.2021", end: "07.2022", description: "Begleitung des Pflegepersonals, erste Erfahrungen in der Patientenbetreuung." },
    ],
    education: [{ degree: "Staatliches Abitur, naturwissenschaftlicher Zweig", school: "Lycée Bilingue de Bonabéri", start: "2018", end: "2021" }],
    skills: ["MS Office", "Patientendokumentation"],
    languages: [{ name: "Deutsch", level: "B2 (Goethe-Institut)" }, { name: "Französisch", level: "Muttersprache" }, { name: "Englisch", level: "B1" }],
  },
  M: {
    jobTitle: "Bewerbung um einen Ausbildungsplatz als Altenpfleger",
    email: "contact@email.com",
    phone: "+237 6 XX XX XX XX",
    address: "Bafoussam, Kamerun",
    birthDate: "22.07.2002",
    birthPlace: "Bafoussam",
    nationality: "Kamerunisch",
    summary: "",
    photoDataUrl: null,
    experience: [
      { role: "Pflegehelfer", company: "Centre Médical de Bafoussam", location: "Bafoussam", start: "03.2022", end: "heute", description: "Unterstützung älterer Patienten im Alltag, Zusammenarbeit mit dem Pflegeteam." },
    ],
    education: [{ degree: "Baccalauréat, naturwissenschaftlicher Zweig", school: "Lycée Bilingue de Bafoussam", start: "2019", end: "2022" }],
    skills: ["Teamarbeit", "Deutschkurs B1"],
    languages: [{ name: "Deutsch", level: "B1 (Goethe-Institut)" }, { name: "Französisch", level: "Muttersprache" }],
  },
};

export function pickGermanPersona(seed: string, gender: Gender, ethnicity: Ethnicity): CvData {
  const fullName = buildName(seed, gender, ethnicity, "fr");
  return { ...germanContent[gender], fullName };
}
