// Modèles de la lettre de présentation Canada (LETTER-CAN-01 à 06),
// validés un par un par l'utilisateur (2026-10-06). Chaque modèle ne décrit
// que son en-tête et ses couleurs ; le rendu est commun
// (src/components/letters/CanadaLetterView.tsx). Le slug du document est
// l'identifiant en minuscules (ex. « letter-can-01 »).

export interface LetterModel {
  id: string;
  name: string;
  /** classic : nom puis coordonnées une par ligne ; split : nom à gauche,
   * coordonnées à droite ; band : bandeau teinté ; executive : grand nom,
   * titre, ligne fine ; modern : petit accent graphique ; minimal : sobre. */
  header: "classic" | "split" | "band" | "executive" | "modern" | "minimal";
  colors: { accent: string; text: string; muted: string; band: string; rule: string };
  /** Corps plus aéré (interligne et espacement des paragraphes). */
  airy?: boolean;
}

export const LETTER_MODELS: LetterModel[] = [
  { id: "LETTER-CAN-01", name: "Classic", header: "classic", colors: { accent: "#1b2f4f", text: "#1a1a1a", muted: "#5f6368", band: "#ffffff", rule: "#c9d1dc" } },
  { id: "LETTER-CAN-02", name: "Professional", header: "split", colors: { accent: "#24364f", text: "#1a1a1a", muted: "#566170", band: "#ffffff", rule: "#24364f" } },
  { id: "LETTER-CAN-03", name: "Corporate", header: "band", colors: { accent: "#13294b", text: "#1a1a1a", muted: "#4f5866", band: "#e9edf3", rule: "#13294b" } },
  { id: "LETTER-CAN-04", name: "Executive", header: "executive", airy: true, colors: { accent: "#111111", text: "#1a1a1a", muted: "#5e5e5e", band: "#ffffff", rule: "#9a9a9a" } },
  { id: "LETTER-CAN-05", name: "Modern", header: "modern", colors: { accent: "#1d4ed8", text: "#111111", muted: "#5b5b5b", band: "#ffffff", rule: "#dbe3f5" } },
  { id: "LETTER-CAN-06", name: "Minimal", header: "minimal", airy: true, colors: { accent: "#222222", text: "#222222", muted: "#6b6b6b", band: "#ffffff", rule: "#ffffff" } },
];

export const letterSlug = (model: LetterModel) => model.id.toLowerCase();
export const letterModelBySlug = (slug: string) => LETTER_MODELS.find((m) => letterSlug(m) === slug);
