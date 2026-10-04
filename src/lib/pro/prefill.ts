import "server-only";
import { prisma } from "@/lib/db/client";
import { emptyBewerbungsbriefData, emptyCoverLetterData, emptyCvData } from "@/lib/cv/empty-data";
import type { BewerbungsbriefData, CoverLetterData, CvData } from "@/lib/cv/types";

/**
 * Préremplissage des éditeurs pour un candidat : le professionnel ne
 * ressaisit ni l'identité, ni les coordonnées, ni (s'ils existent déjà dans
 * un document précédent du candidat) les expériences, formations,
 * compétences ou diplômes. Uniquement à partir des données de CE candidat.
 */
type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  professionalField: string | null;
  languages: string | null;
  germanLevel: string | null;
};

async function lastContent<T>(candidateId: string, type: "CV" | "COVER_LETTER" | "BEWERBUNGSBRIEF"): Promise<T | null> {
  const doc = await prisma.document.findFirst({
    where: { candidateId, type },
    orderBy: { updatedAt: "desc" },
    select: { contentJson: true },
  });
  if (!doc) return null;
  try {
    return JSON.parse(doc.contentJson) as T;
  } catch {
    return null;
  }
}

/** Niveaux proposés par l'éditeur du Bewerbungsbrief (BewerbungsbriefEditor). */
const BB_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

/** Langues du dossier (« Français, Anglais ») + l'allemand si un niveau est connu. */
function candidateLanguages(c: Candidate): CvData["languages"] {
  const names = (c.languages ?? "")
    .split(/[,;/]/)
    .map((n) => n.trim())
    .filter(Boolean);
  if (c.germanLevel && !names.some((n) => /^allemand|^deutsch/i.test(n))) names.push("Allemand");
  return names.length ? names.map((name) => ({ name, level: "" })) : [{ name: "", level: "" }];
}

export async function prefillCv(c: Candidate): Promise<CvData> {
  const previous = await lastContent<CvData>(c.id, "CV");
  const base = previous ?? { ...emptyCvData(), jobTitle: c.professionalField ?? "", languages: candidateLanguages(c) };
  return {
    ...base,
    fullName: fullName(c),
    email: c.email ?? base.email,
    phone: c.phone ?? base.phone,
    // Toujours une ligne vide au moins : l'éditeur affiche les sections à remplir.
    experience: base.experience.length ? base.experience : emptyCvData().experience,
    education: base.education.length ? base.education : emptyCvData().education,
  };
}

export async function prefillCoverLetter(c: Candidate): Promise<CoverLetterData> {
  const cv = await lastContent<CvData>(c.id, "CV");
  return {
    ...emptyCoverLetterData(),
    fullName: fullName(c),
    email: c.email ?? cv?.email ?? "",
    phone: c.phone ?? cv?.phone ?? "",
    address: cv?.address ?? "",
    jobTitle: c.professionalField ?? cv?.jobTitle ?? "",
    keySkills: cv?.skills.join(", ") ?? "",
  };
}

export async function prefillBewerbungsbrief(c: Candidate): Promise<BewerbungsbriefData> {
  const [previous, cv] = await Promise.all([lastContent<BewerbungsbriefData>(c.id, "BEWERBUNGSBRIEF"), lastContent<CvData>(c.id, "CV")]);
  const empty = emptyBewerbungsbriefData();
  return {
    ...empty,
    fullName: fullName(c),
    email: c.email ?? previous?.email ?? cv?.email ?? "",
    phone: c.phone ?? previous?.phone ?? cv?.phone ?? "",
    address: previous?.address ?? cv?.address ?? "",
    city: previous?.city ?? "",
    targetProgram: previous?.targetProgram ?? c.professionalField ?? "",
    // Diplômes et pièces jointes : repris d'une lettre précédente (le
    // destinataire et le texte, eux, changent à chaque candidature).
    qualifications: previous?.qualifications?.length ? previous.qualifications : empty.qualifications,
    attachments: previous?.attachments ?? empty.attachments,
    // Seulement un niveau proposé par l'éditeur (A1 à C1).
    languageLevel: BB_LEVELS.includes(c.germanLevel ?? "") ? c.germanLevel! : (previous?.languageLevel ?? ""),
  };
}
