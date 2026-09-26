import type { CvTheme } from "./types";

// 17 palettes réutilisées par toutes les catégories. Chaque combinaison
// mise en page × thème donne un modèle visuellement distinct dans le
// catalogue (voir docs/ROADMAP.md pour le détail du calcul des quantités).
export const themes: CvTheme[] = [
  { key: "ocean", name: "Océan", accent: "#0f6f8c", accentSoft: "#e3f2f6", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "emerald", name: "Émeraude", accent: "#146c43", accentSoft: "#e5f4ea", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "terracotta", name: "Terracotta", accent: "#b5502e", accentSoft: "#fbe9e2", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "sans" },
  { key: "royal", name: "Bleu Royal", accent: "#1d3a8f", accentSoft: "#e6ebfb", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "graphite", name: "Graphite", accent: "#33363b", accentSoft: "#eceded", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "gold", name: "Or Savane", accent: "#a3781c", accentSoft: "#f8f0dd", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "serif" },
  { key: "berry", name: "Baie", accent: "#8f1d4d", accentSoft: "#f6e2ec", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "slateBlue", name: "Bleu Ardoise", accent: "#3d4f66", accentSoft: "#e9edf2", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "sans" },
  { key: "coral", name: "Corail", accent: "#c14b3a", accentSoft: "#fbe6e2", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "forest", name: "Forêt", accent: "#2b5233", accentSoft: "#e6efe7", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "serif" },
  { key: "navy", name: "Marine", accent: "#123a63", accentSoft: "#e2ecf6", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "teal", name: "Sarcelle", accent: "#0e7c7b", accentSoft: "#e1f2f1", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "plum", name: "Prune", accent: "#5b2a6e", accentSoft: "#f0e5f4", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "sans" },
  { key: "amber", name: "Ambre", accent: "#a15c05", accentSoft: "#f8ecda", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "serif" },
  { key: "rose", name: "Rose Poudré", accent: "#a13a5a", accentSoft: "#f7e5eb", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "steel", name: "Acier", accent: "#41586b", accentSoft: "#e7ecf0", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "sans", bodyFont: "sans" },
  { key: "sage", name: "Sauge", accent: "#4f6f52", accentSoft: "#e8f0e8", text: "#1a1a1a", textMuted: "#5b5b5b", headingFont: "serif", bodyFont: "serif" },
];

// Les catégories ATS (ATS, GERMAN_ATS) restent noir/gris sur blanc — jamais
// de vraie couleur (teinte) — car c'est la convention universelle d'un CV
// "ATS" et ce qu'attendent les utilisateurs de cette catégorie. Mais pour
// tenir l'engagement de volume pris avec l'utilisateur (50 CV ATS), la
// variété entre modèles vient ici de nuances de gris strictement achromatiques
// (R=G=B, donc toujours "noir/gris", jamais une teinte comme le bleu ou le
// vert) combinées aux différentes dispositions, exactement comme les autres
// catégories combinent dispositions × thèmes.
export const atsThemes: CvTheme[] = [
  { key: "noir", name: "Noir", accent: "#000000", accentSoft: "#ffffff", text: "#000000", textMuted: "#595959", headingFont: "sans", bodyFont: "sans" },
  { key: "anthracite", name: "Anthracite", accent: "#1c1b1a", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#6b6660", headingFont: "sans", bodyFont: "sans" },
  { key: "grisArdoise", name: "Gris Ardoise", accent: "#333333", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#6e6e6e", headingFont: "sans", bodyFont: "sans" },
  { key: "grisFonce", name: "Gris Foncé", accent: "#3d3d3d", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#727272", headingFont: "sans", bodyFont: "sans" },
  { key: "charbon", name: "Charbon", accent: "#262626", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#666666", headingFont: "sans", bodyFont: "sans" },
  { key: "grisGraphite", name: "Gris Graphite", accent: "#2e2e2e", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#6a6a6a", headingFont: "sans", bodyFont: "sans" },
  { key: "grisPlomb", name: "Gris Plomb", accent: "#404040", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#747474", headingFont: "sans", bodyFont: "sans" },
  { key: "noirEncre", name: "Noir Encre", accent: "#0d0d0d", accentSoft: "#ffffff", text: "#0d0d0d", textMuted: "#5c5c5c", headingFont: "sans", bodyFont: "sans" },
  { key: "grisBasalte", name: "Gris Basalte", accent: "#363636", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#6f6f6f", headingFont: "sans", bodyFont: "sans" },
  { key: "grisFumee", name: "Gris Fumée", accent: "#4a4a4a", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#7a7a7a", headingFont: "sans", bodyFont: "sans" },
  { key: "grisEtain", name: "Gris Étain", accent: "#454545", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#787878", headingFont: "sans", bodyFont: "sans" },
  { key: "noirProfond", name: "Noir Profond", accent: "#151515", accentSoft: "#ffffff", text: "#151515", textMuted: "#606060", headingFont: "sans", bodyFont: "sans" },
  { key: "grisAcier", name: "Gris Acier Foncé", accent: "#2a2a2a", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#686868", headingFont: "sans", bodyFont: "sans" },
  { key: "grisBeton", name: "Gris Béton", accent: "#383838", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#707070", headingFont: "sans", bodyFont: "sans" },
  { key: "grisMineral", name: "Gris Minéral", accent: "#303030", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#696969", headingFont: "sans", bodyFont: "sans" },
  { key: "grisNuit", name: "Gris Nuit", accent: "#1a1a1a", accentSoft: "#ffffff", text: "#1a1a1a", textMuted: "#656565", headingFont: "sans", bodyFont: "sans" },
  { key: "grisOnyx", name: "Gris Onyx", accent: "#242424", accentSoft: "#ffffff", text: "#1c1b1a", textMuted: "#656565", headingFont: "sans", bodyFont: "sans" },
];

export function getThemeByKey(key: string): CvTheme {
  const theme = themes.find((t) => t.key === key);
  if (!theme) throw new Error(`Thème inconnu: ${key}`);
  return theme;
}
