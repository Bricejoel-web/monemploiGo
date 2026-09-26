"use server";

import { verifySession } from "@/lib/auth/dal";
import type { BewerbungsbriefData, CoverLetterData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { buildFallbackBody, generateWithOpenAI, isOpenAiConfigured } from "@/lib/ai/bewerbungsbrief";
import { buildFallbackCoverLetterBody, generateCoverLetterWithOpenAI } from "@/lib/ai/cover-letter";
import { correctSpelling } from "@/lib/spellcheck";
import { rateLimit } from "@/lib/security/rate-limit";

export interface GenerateBodyResult {
  text?: string;
  error?: string;
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

// Les fautes d'orthographe de l'utilisateur dans les notes de motivation
// (seul champ de texte libre qui alimente la génération) sont corrigées
// avant même de composer la lettre, pour que le texte affiché à l'utilisateur
// soit déjà propre — voir src/lib/spellcheck/index.ts.
export async function generateBewerbungsbriefBodyAction(
  data: BewerbungsbriefData,
  mode: "rules" | "ai",
): Promise<GenerateBodyResult> {
  const session = await verifySession();
  if (!session) return { error: "Session expirée, reconnectez-vous." };

  if (!rateLimit(`generate:${session.userId}`, GENERATE_LIMIT, GENERATE_WINDOW_MS).allowed) {
    return { error: "Trop de générations. Réessayez dans quelques minutes." };
  }

  const correctedData: BewerbungsbriefData = {
    ...data,
    motivationNotes: data.motivationNotes ? await correctSpelling(data.motivationNotes, "de") : data.motivationNotes,
  };

  if (mode === "rules") {
    return { text: buildFallbackBody(correctedData) };
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

  const spellLocale = locale === "en" ? "en" : "fr";
  const correctedData: CoverLetterData = {
    ...data,
    motivationNotes: data.motivationNotes ? await correctSpelling(data.motivationNotes, spellLocale) : data.motivationNotes,
  };

  if (mode === "rules") {
    return { text: buildFallbackCoverLetterBody(correctedData, locale) };
  }

  const result = await generateCoverLetterWithOpenAI(correctedData, locale);
  if ("error" in result) return { error: result.error };
  return { text: result.text };
}
