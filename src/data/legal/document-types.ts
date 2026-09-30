/**
 * Format commun des documents juridiques longs (CGU, politique de
 * confidentialité), affichés par LegalDocumentView.
 */
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "h3"; text: string }
  /** Liens vers d'autres pages du site (chemin sans la langue, ex. "/confidentialite"). */
  | { type: "links"; items: { label: string; path: string }[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  lastUpdatedLabel: string;
  intro: LegalBlock[];
  sections: LegalSection[];
  closing: string;
}

export const p = (text: string): LegalBlock => ({ type: "p", text });
export const list = (items: string[]): LegalBlock => ({ type: "list", items });
export const h3 = (text: string): LegalBlock => ({ type: "h3", text });
export const links = (items: { label: string; path: string }[]): LegalBlock => ({ type: "links", items });
