import { z } from "zod";

/**
 * Informations de la structure (inscription Pro et paramètres) : mêmes
 * règles partout, toujours revérifiées côté serveur.
 */
export const structureFields = {
  companyName: z
    .string()
    .trim()
    .min(2, { error: "Le nom de la structure doit contenir au moins 2 caractères." })
    .max(120, { error: "Le nom de la structure est trop long (120 caractères au maximum)." }),
  managerName: z
    .string()
    .trim()
    .min(2, { error: "Le nom du responsable doit contenir au moins 2 caractères." })
    .max(120, { error: "Le nom du responsable est trop long (120 caractères au maximum)." }),
  email: z.email({ error: "Adresse e-mail invalide." }).trim(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 .-]{7,19}$/, { error: "Numéro de téléphone invalide (chiffres, espaces et « + » uniquement)." }),
};
