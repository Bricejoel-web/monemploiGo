import type { BewerbungsbriefData, CoverLetterData, CvData } from "./types";

// Contenus de départ des éditeurs (formulaires vides). Partagés entre les
// éditeurs et le préremplissage de l'espace Pro (src/lib/pro/prefill.ts),
// pour que les deux partent toujours exactement des mêmes valeurs.

export function emptyCvData(): CvData {
  return {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    photoDataUrl: null,
    experience: [{ role: "", company: "", location: "", start: "", end: "", description: "" }],
    education: [{ degree: "", school: "", location: "", start: "", end: "", description: "" }],
    skills: [],
    languages: [{ name: "", level: "" }],
  };
}

export function emptyCoverLetterData(): CoverLetterData {
  return {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    recipientName: "",
    recipientCompany: "",
    date: "",
    subject: "",
    body: "",
    jobTitle: "",
    sourceOfListing: "",
    yearsOfExperience: "",
    keySkills: "",
    motivationNotes: "",
  };
}

export function emptyBewerbungsbriefData(): BewerbungsbriefData {
  return {
    fullName: "",
    address: "",
    phone: "",
    email: "",
    recipientInstitution: "",
    recipientAddress: "",
    recipientContactName: "",
    city: "",
    date: new Date().toLocaleDateString("de-DE"),
    targetProgram: "",
    referenceNumber: "",
    sourceOfListing: "",
    qualifications: [{ title: "", institution: "", date: "" }],
    languageLevel: "",
    motivationNotes: "",
    availabilityDate: "",
    attachments: [],
    body: "",
  };
}
