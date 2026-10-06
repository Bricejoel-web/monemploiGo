"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireProAccount } from "./dal";
import { getProAccess } from "./subscription";
import { LOCKED_TRANSACTION, PRO_STARTER } from "./plans";
import { APPLICATION_TYPES, EDUCATION_LEVELS, GERMAN_LEVELS, germanLevelRelevant } from "./candidate-options";

export type CandidateFormState =
  | {
      errors?: Partial<Record<"firstName" | "lastName" | "email" | "phone" | "destinationCountry" | "professionalField" | "applicationType" | "educationLevel" | "languages" | "germanLevel", string[]>>;
      message?: string;
    }
  | undefined;

/** Champ facultatif : vide → null. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} : ${max} caractères au maximum.` })
    .transform((v) => v || null);

const optionalChoice = (choices: readonly string[], label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || choices.includes(v), { error: `${label} : choix invalide.` })
    .transform((v) => v || null);

const CandidateSchema = z.object({
  firstName: z.string().trim().min(1, { error: "Le prénom est obligatoire." }).max(80, { error: "Prénom : 80 caractères au maximum." }),
  lastName: z.string().trim().min(1, { error: "Le nom est obligatoire." }).max(80, { error: "Nom : 80 caractères au maximum." }),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, { error: "Adresse e-mail invalide." })
    .transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9][0-9 .-]{5,19}$/.test(v), { error: "Numéro de téléphone invalide." })
    .transform((v) => v || null),
  destinationCountry: optionalText(80, "Pays de destination"),
  professionalField: optionalText(120, "Domaine professionnel"),
  applicationType: optionalChoice(APPLICATION_TYPES, "Type de candidature"),
  educationLevel: optionalChoice(EDUCATION_LEVELS, "Niveau d'études"),
  languages: optionalText(200, "Langues"),
  germanLevel: optionalChoice(GERMAN_LEVELS, "Niveau d'allemand"),
});

const FIELDS = ["firstName", "lastName", "email", "phone", "destinationCountry", "professionalField", "applicationType", "educationLevel", "languages", "germanLevel"] as const;

function parseCandidate(formData: FormData) {
  const validated = CandidateSchema.safeParse(Object.fromEntries(FIELDS.map((f) => [f, formData.get(f) ?? ""])));
  if (!validated.success) return { success: false as const, errors: z.flattenError(validated.error).fieldErrors };
  const data = validated.data;
  // Niveau d'allemand : seulement quand il est pertinent (formulaire et serveur d'accord).
  if (!germanLevelRelevant(data.destinationCountry ?? "", data.applicationType ?? "")) data.germanLevel = null;
  return { success: true as const, data };
}

const NOT_ACTIVE = "Votre abonnement Pro Starter n'est pas actif : les dossiers sont consultables mais ne peuvent plus être modifiés.";

/**
 * Création d'un candidat. Tout est décidé ici, jamais par le navigateur :
 * compte Pro déduit de la session, abonnement actif obligatoire, et limite
 * de 10 candidats ACTIFS vérifiée sous verrou (deux créations simultanées ne
 * peuvent pas dépasser la limite).
 */
export async function createCandidate(_state: CandidateFormState, formData: FormData): Promise<CandidateFormState> {
  const account = await requireProAccount();

  if ((await getProAccess(account.id)).state !== "active") {
    return { message: "Votre abonnement Pro Starter n'est pas actif : la création de candidats est indisponible." };
  }
  if (!(await rateLimit(`pro-candidate:${account.id}`, 30, 15 * 60 * 1000)).allowed) {
    return { message: "Trop de créations en peu de temps. Réessayez dans quelques minutes." };
  }

  const parsed = parseCandidate(formData);
  if (!parsed.success) return { errors: parsed.errors };
  const data = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    // Verrou sur le compte Pro : les créations concurrentes passent une par une.
    await tx.$queryRaw`SELECT "id" FROM "ProfessionalAccount" WHERE "id" = ${account.id} FOR UPDATE`;
    const active = await tx.professionalCandidate.count({ where: { professionalAccountId: account.id, status: "ACTIVE" } });
    if (active >= PRO_STARTER.maxActiveCandidates) return null;
    return tx.professionalCandidate.create({ data: { ...data, professionalAccountId: account.id }, select: { id: true } });
  }, LOCKED_TRANSACTION);

  if (!created) {
    return {
      message: `Limite de ${PRO_STARTER.maxActiveCandidates} candidats actifs atteinte. Archivez un candidat terminé pour en ajouter un nouveau.`,
    };
  }
  redirect(`/fr/pro/candidats/${created.id}`);
}

// ---------------------------------------------------------------------------
// Phase 4 : modifier, archiver, réactiver, supprimer. L'identifiant du
// candidat vient du navigateur : chaque écriture filtre donc AUSSI par le
// compte Pro de la session (`professionalAccountId`), si bien qu'un
// identifiant d'une autre structure ne touche jamais rien.

const dossier = (candidateId: string, notice?: string) => `/fr/pro/candidats/${candidateId}${notice ? `?${notice}` : ""}`;

/** Modification : abonnement actif obligatoire (lecture seule après expiration). */
export async function updateCandidate(candidateId: string, _state: CandidateFormState, formData: FormData): Promise<CandidateFormState> {
  const account = await requireProAccount();
  if ((await getProAccess(account.id)).state !== "active") return { message: NOT_ACTIVE };

  const parsed = parseCandidate(formData);
  if (!parsed.success) return { errors: parsed.errors };

  const { count } = await prisma.professionalCandidate.updateMany({
    where: { id: candidateId, professionalAccountId: account.id },
    data: parsed.data,
  });
  if (count === 0) return { message: "Ce dossier n'existe pas dans votre espace." };
  redirect(dossier(candidateId, "modifie=1"));
}

/** Archivage : le candidat ne compte plus dans la limite des 10 actifs. */
export async function archiveCandidate(candidateId: string) {
  const account = await requireProAccount();
  if ((await getProAccess(account.id)).state !== "active") redirect(dossier(candidateId, "erreur=inactif"));
  await prisma.professionalCandidate.updateMany({
    where: { id: candidateId, professionalAccountId: account.id, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });
  redirect(dossier(candidateId, "archive=1"));
}

/** Réactivation : seulement s'il reste une place, vérifié sous verrou (comme la création). */
export async function reactivateCandidate(candidateId: string) {
  const account = await requireProAccount();
  if ((await getProAccess(account.id)).state !== "active") redirect(dossier(candidateId, "erreur=inactif"));

  const reactivated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "ProfessionalAccount" WHERE "id" = ${account.id} FOR UPDATE`;
    const active = await tx.professionalCandidate.count({ where: { professionalAccountId: account.id, status: "ACTIVE" } });
    if (active >= PRO_STARTER.maxActiveCandidates) return false;
    const { count } = await tx.professionalCandidate.updateMany({
      where: { id: candidateId, professionalAccountId: account.id, status: "ARCHIVED" },
      data: { status: "ACTIVE" },
    });
    return count === 1;
  }, LOCKED_TRANSACTION);
  redirect(dossier(candidateId, reactivated ? "reactive=1" : "erreur=limite"));
}

/**
 * Suppression définitive du candidat et de ses documents (cascade en base).
 * Possible même en lecture seule (droit à l'effacement des candidats).
 * Confirmation explicite obligatoire, revérifiée ici. Le quota déjà
 * consommé n'est pas rendu (il est compté sur la période, pas sur les
 * documents existants).
 */
export async function deleteCandidate(candidateId: string, formData: FormData) {
  const account = await requireProAccount();
  if (formData.get("confirm") !== "on") redirect(`${dossier(candidateId)}/supprimer?erreur=confirmation`);
  await prisma.professionalCandidate.deleteMany({ where: { id: candidateId, professionalAccountId: account.id } });
  redirect("/fr/pro/candidats?supprime=1");
}
