"use server";

import { verifySession } from "@/lib/auth/dal";
import type { BewerbungsbriefData, CoverLetterData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { buildFallbackBody } from "@/lib/ai/bewerbungsbrief";
import { buildFallbackCoverLetterBody } from "@/lib/ai/cover-letter";
import { detectGermanOrFrench } from "@/lib/spellcheck";
import { rateLimit } from "@/lib/security/rate-limit";

export interface GenerateBodyResult {
  text?: string;
  error?: string;
  /** Information non bloquante à afficher sous le texte généré. */
  notice?: "notesNotGerman";
}

// Génération automatique à partir des informations saisies, par règles
// uniquement : aucune IA (fonction retirée du projet le 2026-10-05). Limite
// de débit contre les clics répétés ou scriptés.
const GENERATE_LIMIT = 20;
const GENERATE_WINDOW_MS = 5 * 60 * 1000;

// Les notes du client sont reprises telles quelles (plus de correction
// silencieuse : voir src/lib/documents/actions.ts) ; les fautes éventuelles
// sont signalées dans l'éditeur.
export async function generateBewerbungsbriefBodyAction(
  data: BewerbungsbriefData,
): Promise<GenerateBodyResult> {
  const session = await verifySession();
  if (!session) return { error: "Session expirée, reconnectez-vous." };

  if (!rateLimit(`generate:${session.userId}`, GENERATE_LIMIT, GENERATE_WINDOW_MS).allowed) {
    return { error: "Trop de générations. Réessayez dans quelques minutes." };
  }

  // Des notes rédigées en français seraient collées telles quelles au milieu
  // d'une lettre allemande : le générateur par règles ne sait pas traduire.
  // On les laisse de côté et on prévient le client.
  const notesLanguage = data.motivationNotes?.trim() ? await detectGermanOrFrench(data.motivationNotes) : "unknown";
  const notesNotGerman = notesLanguage === "fr";
  const correctedData: BewerbungsbriefData = {
    ...data,
    motivationNotes: notesNotGerman ? "" : data.motivationNotes,
  };

  return { text: buildFallbackBody(correctedData), ...(notesNotGerman ? { notice: "notesNotGerman" as const } : {}) };
}

export async function generateCoverLetterBodyAction(
  data: CoverLetterData,
  locale: Locale,
): Promise<GenerateBodyResult> {
  const session = await verifySession();
  if (!session) return { error: "Session expirée, reconnectez-vous." };

  if (!rateLimit(`generate:${session.userId}`, GENERATE_LIMIT, GENERATE_WINDOW_MS).allowed) {
    return { error: "Trop de générations. Réessayez dans quelques minutes." };
  }

  const correctedData: CoverLetterData = data;

  return { text: buildFallbackCoverLetterBody(correctedData, locale) };
}
