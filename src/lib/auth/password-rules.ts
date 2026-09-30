import { z } from "zod";

/**
 * Règle de mot de passe unique du site (inscription particulier, inscription
 * Pro, réinitialisation) : majuscule + minuscule + chiffre + caractère
 * spécial, à la demande explicite de l'utilisateur. Toujours revérifiée côté
 * serveur, même si le formulaire l'affiche déjà en direct.
 */
export const passwordSchema = z
  .string()
  .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
  .regex(/[A-Z]/, { error: "Doit contenir au moins une lettre majuscule." })
  .regex(/[a-z]/, { error: "Doit contenir au moins une lettre minuscule." })
  .regex(/[0-9]/, { error: "Doit contenir au moins un chiffre." })
  .regex(/[^A-Za-z0-9]/, { error: "Doit contenir au moins un caractère spécial." });
