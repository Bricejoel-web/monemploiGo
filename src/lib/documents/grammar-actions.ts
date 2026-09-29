"use server";

import { findSuggestions } from "@/lib/spellcheck";

/**
 * Suggestions pour un texte de l'éditeur (profil, descriptions, lettre),
 * que le client accepte ou non — rien n'est jamais corrigé d'office. Voir
 * src/lib/spellcheck/index.ts pour ce qui est vérifié dans chaque langue.
 * Aucun envoi à un service extérieur.
 */
export async function grammarSuggestionsAction(text: string, language: string): Promise<{ wrong: string; fix: string }[]> {
  if (typeof text !== "string" || text.length > 6000) return [];
  return findSuggestions(text, language);
}
