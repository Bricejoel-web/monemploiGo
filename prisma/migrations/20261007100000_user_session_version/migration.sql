-- Version de session par compte : une réinitialisation du mot de passe ferme
-- les sessions déjà ouvertes (ajout d'une colonne, valeur 0 par défaut).
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

