import type { CvData, CoverLetterData, BewerbungsbriefData } from "./types";
import type { Locale } from "@/i18n/config";

// Contenu en allemand quelle que soit la langue du site (destiné à un
// employeur allemand, comme les CV Allemagne — voir docs/ROADMAP.md).
const bewerbungsbriefSample: BewerbungsbriefData = {
  fullName: "Carine Mbarga",
  address: "B.P. 1234, Douala, Kamerun",
  phone: "+237 6 00 00 00 00",
  email: "carine.mbarga@email.com",
  recipientInstitution: "Klinikum Musterstadt",
  recipientAddress: "Krankenhausweg 4, 10117 Berlin",
  recipientContactName: "",
  city: "Douala",
  date: "1. Januar 2026",
  targetProgram: "Pflegefachfrau",
  referenceNumber: "",
  sourceOfListing: "Stellenanzeige (Website)",
  qualifications: [{ title: "Realschulabschluss", institution: "Lycée Moderne", date: "06/2022" }],
  languageLevel: "B2",
  motivationNotes: "",
  availabilityDate: "",
  attachments: ["Lebenslauf", "Zeugnisse", "Sprachzertifikat"],
  // Texte de démonstration complet (et non plus une phrase tronquée) pour
  // que les aperçus du catalogue Bewerbungsbrief ressemblent à un vrai
  // document fini plutôt qu'à une lettre à moitié vide. Volontairement
  // générique (même texte pour les 35 modèles) puisqu'il ne sert qu'à
  // l'aperçu : le formulaire génère un texte personnalisé à la place dès
  // que l'utilisateur remplit ses propres informations. Salutation
  // ("Sehr geehrte Damen und Herren,") et formule de politesse finale sont
  // déjà ajoutées séparément par chaque mise en page, ce texte ne les
  // reprend donc pas. Ouverture volontairement différente du cliché
  // "Hiermit bewerbe ich mich..." (voir la refonte qualité du 2026-09-21
  // dans ce même journal).
  body: "Mit großem Interesse habe ich Ihre Stellenanzeige gelesen und möchte mich um die ausgeschriebene Position bewerben.\n\nIm Rahmen meiner bisherigen Ausbildung und praktischen Erfahrungen konnte ich bereits wichtige Kenntnisse in diesem Bereich sammeln. Ich zeichne mich durch Zuverlässigkeit, Teamfähigkeit und eine schnelle Auffassungsgabe aus und bin es gewohnt, mich rasch in neue Aufgaben einzuarbeiten.\n\nIch bin überzeugt, dass ich mit meinem Profil gut zu Ihrem Unternehmen passe, und freue mich darauf, meine Motivation sowie meine Fähigkeiten in einem persönlichen Gespräch näher vorzustellen.",
};

const samples: Record<Locale, { cv: CvData; letter: CoverLetterData }> = {
  fr: {
    cv: {
      fullName: "Carine Mbarga",
      jobTitle: "Assistante de gestion administrative",
      email: "carine.mbarga@email.com",
      phone: "+237 6 00 00 00 00",
      address: "Douala, Cameroun",
      summary:
        "Professionnelle organisée et rigoureuse avec 4 ans d'expérience en gestion administrative et relation client, à la recherche d'un nouveau poste à responsabilités.",
      photoDataUrl: null,
      experience: [
        {
          role: "Assistante administrative",
          company: "Groupe Sika",
          location: "Douala",
          start: "2022",
          end: "Aujourd'hui",
          description: "Gestion des dossiers clients, coordination des plannings et suivi budgétaire.",
        },
        {
          role: "Agente d'accueil",
          company: "Hôtel Akwa Palace",
          location: "Douala",
          start: "2020",
          end: "2022",
          description: "Accueil physique et téléphonique, gestion des réservations.",
        },
      ],
      education: [
        {
          degree: "BTS Gestion des entreprises",
          school: "Institut Supérieur de Commerce",
          location: "Douala",
          start: "2018",
          end: "2020",
        },
      ],
      skills: ["Gestion administrative", "Microsoft Office", "Relation client", "Organisation"],
      languages: [
        { name: "Français", level: "Langue maternelle" },
        { name: "Anglais", level: "Intermédiaire" },
      ],
    },
    letter: {
      fullName: "Carine Mbarga",
      email: "carine.mbarga@email.com",
      phone: "+237 6 00 00 00 00",
      address: "Douala, Cameroun",
      recipientCompany: "Entreprise XYZ",
      recipientName: "Service Recrutement",
      date: "Douala, le 1 janvier 2026",
      subject: "Candidature au poste d'assistante de gestion",
      // Texte de démonstration complet (voir le commentaire équivalent sur
      // bewerbungsbriefSample plus haut : même logique, même texte générique
      // réutilisé sur les 100 modèles du catalogue). La formule de politesse
      // finale et la signature sont déjà ajoutées séparément par le rendu.
      body: "Madame, Monsieur,\n\nVotre offre d'emploi a retenu toute mon attention et je souhaite vous soumettre ma candidature avec grand intérêt.\n\nAu cours de mon parcours, j'ai développé de solides compétences organisationnelles ainsi qu'un réel sens du travail en équipe. Rigoureux(se) et motivé(e), j'ai toujours su m'adapter rapidement aux exigences de chaque mission confiée, en conciliant qualité du travail fourni et respect des délais.\n\nJe suis convaincu(e) que mon profil correspond aux attentes du poste, et je serais ravi(e) de vous exposer plus en détail ma motivation ainsi que les compétences que je pourrais mettre au service de votre équipe, à l'occasion d'un entretien.",
    },
  },
  en: {
    cv: {
      fullName: "Brenda Ayuk",
      jobTitle: "Administrative Assistant",
      email: "brenda.ayuk@email.com",
      phone: "+237 600 000 000",
      address: "Buea, Cameroon",
      summary:
        "Organized and detail-oriented professional with 4 years of experience in administrative management, looking for a new challenge.",
      photoDataUrl: null,
      experience: [
        {
          role: "Administrative Assistant",
          company: "Sika Group",
          location: "Buea",
          start: "2022",
          end: "Present",
          description: "Managed client files, coordinated schedules and tracked budgets.",
        },
        {
          role: "Front Desk Officer",
          company: "Mountain Hotel",
          location: "Buea",
          start: "2020",
          end: "2022",
          description: "Handled guest reception and reservations.",
        },
      ],
      education: [
        {
          degree: "BSc Business Administration",
          school: "University of Buea",
          location: "Buea",
          start: "2018",
          end: "2020",
        },
      ],
      skills: ["Administrative management", "Microsoft Office", "Customer service", "Organization"],
      languages: [
        { name: "English", level: "Native" },
        { name: "French", level: "Intermediate" },
      ],
    },
    letter: {
      fullName: "Brenda Ayuk",
      email: "brenda.ayuk@email.com",
      phone: "+237 600 000 000",
      address: "Buea, Cameroon",
      recipientCompany: "XYZ Company",
      recipientName: "Hiring Team",
      date: "Buea, January 1, 2026",
      subject: "Application for Administrative Assistant position",
      // Same complete demo text pattern as the French sample above.
      body: "Dear Hiring Manager,\n\nYour job posting immediately caught my attention, and I am excited to submit my application for this position.\n\nThroughout my career, I have developed strong organizational skills along with a genuine ability to work well within a team. Diligent and self-motivated, I have consistently adapted quickly to the requirements of each new assignment, always balancing quality of work with meeting deadlines.\n\nI am confident that my profile matches what you are looking for, and I would welcome the opportunity to discuss my motivation and the skills I could bring to your team in more detail during an interview.",
    },
  },
};

export function getSampleCvData(locale: Locale): CvData {
  return samples[locale].cv;
}

export function getSampleCoverLetterData(locale: Locale): CoverLetterData {
  return samples[locale].letter;
}

export function getSampleBewerbungsbriefData(): BewerbungsbriefData {
  return bewerbungsbriefSample;
}
