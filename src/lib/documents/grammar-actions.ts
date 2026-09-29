"use server";

import { findParticipleMistakes } from "@/lib/spellcheck";

/**
 * Suggestions de grammaire pour un texte de l'éditeur (profil, descriptions,
 * lettre). Français uniquement ; jamais d'envoi à un service extérieur : le
 * dictionnaire est chargé sur notre serveur (voir src/lib/spellcheck).
 */
export async function grammarSuggestionsAction(text: string, language: string): Promise<{ wrong: string; fix: string }[]> {
  if (language !== "fr" || typeof text !== "string" || text.length > 6000) return [];
  return findParticipleMistakes(text);
}
