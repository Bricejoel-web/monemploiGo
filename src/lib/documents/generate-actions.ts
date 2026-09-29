"use server";

import { verifySession } from "@/lib/auth/dal";
import type { BewerbungsbriefData, CoverLetterData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { buildFallbackBody, generateWithOpenAI, isOpenAiConfigured } from "@/lib/ai/bewerbungsbrief";
import { buildFallbackCoverLetterBody, generateCoverLetterWithOpenAI } from "@/lib/ai/cover-letter";
import { detectGermanOrFrench } from "@/lib/spellcheck";
import { rateLimit } from "@/lib/security/rate-limit";

export interface GenerateBodyResult {
  text?: string;
  error?: string;
  /** Information non bloquante à afficher sous le texte généré. */
  notice?: "notesNotGerman";
}

export async function isAiGenerationAvailableAction(): Promise<boolean> {
  return isOpenAiConfigured();
}

// Limite de débit sur la génération : une fois OPENAI_API_KEY configurée,
// chaque appel en mode "ai" a un coût réel — sans cette limite, un clic
// répété (ou scripté) sur "Régénérer avec l'IA" serait un vecteur d'abus
// direct. Même limite appliquée au mode "rules" par cohérence/simplicité.
const GENERATE_LIMIT = 20;
const GENERATE_WINDOW_MS = 5 * 60 * 1000;

// Les notes du client sont reprises telles quelles (plus de correction
// silencieuse : voir src/lib/documents/actions.ts) ; les fautes éventuelles
// sont signalées dans l'éditeur.
export async function generateBewerbungsbriefBodyAction(
  data: BewerbungsbriefData,
  mode: "rules" | "ai",
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

  if (mode === "rules") {
    return { text: buildFallbackBody(correctedData), ...(notesNotGerman ? { notice: "notesNotGerman" as const } : {}) };
  }

  const result = await generateWithOpenAI(correctedData);
  if ("error" in result) return { error: result.error };
  return { text: result.text };
}

export async function generateCoverLetterBodyAction(
  data: CoverLetterData,
  locale: Locale,
  mode: "rules" | "ai",
): Promise<GenerateBodyResult> {
  const session = await verifySession();
  if (!session) return { error: "Session expirée, reconnectez-vous." };

  if (!rateLimit(`generate:${session.userId}`, GENERATE_LIMIT, GENERATE_WINDOW_MS).allowed) {
    return { error: "Trop de générations. Réessayez dans quelques minutes." };
  }

  const correctedData: CoverLetterData = data;

  if (mode === "rules") {
    return { text: buildFallbackCoverLetterBody(correctedData, locale) };
  }

  const result = await generateCoverLetterWithOpenAI(correctedData, locale);
  if ("error" in result) return { error: result.error };
  return { text: result.text };
}
