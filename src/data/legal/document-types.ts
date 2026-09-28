/**
 * Format commun des documents juridiques longs (CGU, politique de
 * confidentialité), affichés par LegalDocumentView.
 */
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "h3"; text: string };

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
