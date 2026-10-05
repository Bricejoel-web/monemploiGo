import type { CvData } from "../types";

// Profils d'exemple des CV Canada, pour les vignettes du catalogue
// uniquement : assez complets pour remplir une page A4 sans agrandir le
// texte (les CV Canada n'agrandissent jamais leur contenu). Fictifs,
// coordonnées masquées. Le nom est ajouté par pickCanadaPersona.
type Content = Omit<CvData, "fullName">;

export const CANADA_SAMPLE_CONTENT: Record<"fr" | "en", Record<"F" | "M", Content>> = {
  fr: {
    F: {
      jobTitle: "Comptable",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroun",
      linkedin: "linkedin.com/in/profil",
      summary: "Comptable avec 7 ans d'expérience en comptabilité générale, fiscalité et reporting financier. Habituée aux clôtures mensuelles et aux audits, avec une forte attention aux détails.",
      photoDataUrl: null,
      experience: [
        { role: "Comptable principale", company: "Société commerciale du Littoral", location: "Douala", start: "03/2021", end: "présent", description: "Tenue de la comptabilité générale de 3 filiales\nPréparation des déclarations fiscales mensuelles\nRéduction du délai de clôture de 8 à 5 jours" },
        { role: "Comptable", company: "Cabinet d'expertise comptable", location: "Yaoundé", start: "07/2018", end: "02/2021", description: "Suivi de 25 dossiers clients PME\nPréparation des liasses fiscales\nParticipation aux inventaires annuels" },
        { role: "Aide-comptable", company: "Groupe agro-industriel", location: "Yaoundé", start: "01/2017", end: "06/2018", description: "Saisie des pièces comptables\nRapprochements bancaires mensuels" },
      ],
      education: [{ degree: "Master en comptabilité, contrôle et audit", school: "Université de Yaoundé II", start: "09/2015", end: "07/2017" }],
      skills: ["Comptabilité générale", "Fiscalité", "Rapprochements bancaires", "États financiers", "Audit interne", "Excel avancé", "Sage Comptabilité", "Normes OHADA"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "B2" }, { name: "Espagnol", level: "A2" }],
      certifications: [{ name: "Certificat en comptabilité informatisée", issuer: "Centre de formation professionnelle", year: "2020" }, { name: "Excel Expert", issuer: "Microsoft", year: "2023" }],
    },
    M: {
      jobTitle: "Développeur web",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Yaoundé, Cameroun",
      linkedin: "linkedin.com/in/profil",
      summary: "Développeur web avec 5 ans d'expérience sur des applications de gestion et des sites à fort trafic. À l'aise du front-end au back-end, attaché à la qualité du code et aux tests.",
      photoDataUrl: null,
      experience: [
        { role: "Développeur full stack", company: "Agence numérique du Centre", location: "Yaoundé", start: "02/2022", end: "présent", description: "Développement d'applications React et Node.js\nMise en place de tests automatisés\nAccompagnement de 2 développeurs juniors" },
        { role: "Développeur front-end", company: "Entreprise de services numériques", location: "Douala", start: "06/2020", end: "01/2022", description: "Refonte d'un portail client utilisé chaque jour\nAmélioration des temps de chargement des pages\nIntégration de maquettes responsives" },
        { role: "Stagiaire développeur", company: "Start-up de paiement mobile", location: "Douala", start: "01/2020", end: "05/2020", description: "Création de tableaux de bord internes\nCorrection d'anomalies" },
      ],
      education: [{ degree: "Licence en génie logiciel", school: "Université de Yaoundé I", start: "09/2016", end: "07/2019" }],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git", "Tests automatisés", "API REST"],
      languages: [{ name: "Français", level: "Langue maternelle" }, { name: "Anglais", level: "C1" }, { name: "Allemand", level: "A2" }],
      certifications: [{ name: "Certificat de développeur JavaScript", issuer: "Organisme de formation en ligne", year: "2022" }, { name: "Scrum Fundamentals", issuer: "Formation agile", year: "2023" }],
    },
  },
  en: {
    F: {
      jobTitle: "Accountant",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Douala, Cameroon",
      linkedin: "linkedin.com/in/profile",
      summary: "Accountant with 7 years of experience in general accounting, taxation and financial reporting. Used to month-end closings and audits, with strong attention to detail.",
      photoDataUrl: null,
      experience: [
        { role: "Senior Accountant", company: "Littoral Trading Company", location: "Douala", start: "03/2021", end: "present", description: "Managed the general ledger for 3 subsidiaries\nPrepared monthly tax returns\nReduced month-end closing from 8 to 5 days" },
        { role: "Accountant", company: "Accounting firm", location: "Yaoundé", start: "07/2018", end: "02/2021", description: "Handled 25 small-business client files\nPrepared annual tax packages\nTook part in year-end inventories" },
        { role: "Accounting Assistant", company: "Agro-industrial group", location: "Yaoundé", start: "01/2017", end: "06/2018", description: "Recorded accounting entries\nPerformed monthly bank reconciliations" },
      ],
      education: [{ degree: "Master's degree in Accounting, Control and Audit", school: "University of Yaoundé II", start: "09/2015", end: "07/2017" }],
      skills: ["General accounting", "Taxation", "Bank reconciliations", "Financial statements", "Internal audit", "Advanced Excel", "Sage Accounting", "OHADA standards"],
      languages: [{ name: "French", level: "Native" }, { name: "English", level: "B2" }, { name: "Spanish", level: "A2" }],
      certifications: [{ name: "Computerized Accounting Certificate", issuer: "Vocational training centre", year: "2020" }, { name: "Excel Expert", issuer: "Microsoft", year: "2023" }],
    },
    M: {
      jobTitle: "Web Developer",
      email: "contact@email.com",
      phone: "+237 6 XX XX XX XX",
      address: "Yaoundé, Cameroon",
      linkedin: "linkedin.com/in/profile",
      summary: "Web developer with 5 years of experience building business applications and high-traffic websites. Comfortable from front end to back end, committed to code quality and testing.",
      photoDataUrl: null,
      experience: [
        { role: "Full Stack Developer", company: "Central Digital Agency", location: "Yaoundé", start: "02/2022", end: "present", description: "Built React and Node.js applications\nSet up automated testing\nMentored 2 junior developers" },
        { role: "Front-End Developer", company: "IT services company", location: "Douala", start: "06/2020", end: "01/2022", description: "Redesigned a customer portal used daily\nImproved page load times\nImplemented responsive layouts" },
        { role: "Developer Intern", company: "Mobile payment start-up", location: "Douala", start: "01/2020", end: "05/2020", description: "Built internal dashboards\nFixed bugs" },
      ],
      education: [{ degree: "Bachelor's degree in Software Engineering", school: "University of Yaoundé I", start: "09/2016", end: "07/2019" }],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git", "Automated testing", "REST APIs"],
      languages: [{ name: "French", level: "Native" }, { name: "English", level: "C1" }, { name: "German", level: "A2" }],
      certifications: [{ name: "JavaScript Developer Certificate", issuer: "Online training provider", year: "2022" }, { name: "Scrum Fundamentals", issuer: "Agile training", year: "2023" }],
    },
  },
};
