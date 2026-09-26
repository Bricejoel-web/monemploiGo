import "server-only";

// Appel bas niveau à l'API OpenAI, partagé par tous les générateurs de texte
// du site (Bewerbungsbrief, lettres de motivation classiques). Dégradation
// gracieuse si la clé n'est pas configurée — jamais d'échec silencieux.
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function isOpenAiConfigured(): boolean {
  return Boolean(apiKey);
}

export async function callOpenAiChat(prompt: string): Promise<{ text: string } | { error: string }> {
  if (!apiKey) {
    return { error: "OpenAI non configuré." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      return { error: `Erreur OpenAI (${response.status}).` };
    }

    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { error: "Réponse OpenAI vide." };
    return { text };
  } catch {
    return { error: "Impossible de contacter OpenAI." };
  }
}
