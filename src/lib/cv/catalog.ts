import {
  standardLayouts,
  premiumLayouts,
  atsLayouts,
  germanAtsLayouts,
  coverLetterLayouts,
  bewerbungsbriefLayouts,
} from "./layouts";
import { themes, atsThemes, getThemeByKey } from "./themes";
import type {
  CvCategory,
  CvLayoutId,
  CvTemplateMeta,
  CoverLetterTemplateMeta,
  BewerbungsbriefLayoutId,
  BewerbungsbriefTemplateMeta,
} from "./types";

export const PRICE_FCFA: Record<CvCategory, number> = {
  STANDARD: 1000,
  PREMIUM: 2000,
  ATS: 1000,
  GERMAN_ATS: 1500,
};

export const COVER_LETTER_PRICE_FCFA = 1500;

// Aligné sur le prix des CV Allemagne (ATS) : même public (candidatures
// Ausbildung/Pflege), même niveau de spécialisation du document.
export const BEWERBUNGSBRIEF_PRICE_FCFA = 1500;

// Exportés (et non plus seulement locaux à ce fichier) pour être réutilisés
// comme titres de section dans le défilement horizontal mobile des pages
// catalogue (voir CatalogSwipeSection.tsx) : les modèles y sont regroupés
// par mise en page, chaque groupe affichant ce libellé.
export const LAYOUT_LABELS: Record<CvLayoutId, string> = {
  "std-classique": "Classique",
  "std-deux-colonnes": "Deux colonnes sobres",
  "std-bandeau": "Bandeau discret",
  "prem-cercles": "Cercles modernes",
  "prem-triangles": "Sidebar triangles",
  "prem-vagues": "Vagues organiques",
  "prem-pilules": "Sidebar pilules",
  "prem-facettes": "Cercle facettes",
  "prem-diagonale": "Bandeau diagonal",
  "prem-banniere": "Bannière débutant",
  "prem-vague-laterale": "Vague latérale",
  "ats-executif": "Exécutif clean",
  "ats-minimal": "Minimaliste",
  "ats-compact": "Compact",
  "de-tabellarisch": "Lebenslauf tabellarisch",
  "de-blockschema": "Lebenslauf par blocs",
  "de-kompakt": "Lebenslauf compact",
};

export const BB_LAYOUT_LABELS: Record<BewerbungsbriefLayoutId, string> = {
  "bb-din-klassisch": "DIN 5008 classique",
  "bb-modern-kopf": "En-tête moderne",
  "bb-tabellen-kopf": "En-tête tableau",
  "bb-anlagen-liste": "Anlagen en liste",
  "bb-kompakt": "Compact",
};

// Même principe pour les lettres de motivation classiques (10 mises en
// page). Les clés reprennent `CoverLetterLayoutConfig.key`.
export const CL_LAYOUT_LABELS: Record<string, string> = {
  "cl-classic-block": "Bloc classique",
  "cl-modern-left": "Moderne (à gauche)",
  "cl-modern-right": "Moderne (à droite)",
  "cl-minimal": "Minimaliste",
  "cl-elegant-serif": "Élégant serif",
  "cl-executive": "Exécutif",
  "cl-creative-header": "En-tête créatif",
  "cl-compact": "Compact",
  "cl-formal-din": "DIN formel",
  "cl-friendly-modern": "Moderne convivial",
};

const slugify = (parts: (string | number)[]) =>
  parts.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");

function buildCategory(
  category: CvCategory,
  layouts: CvLayoutId[],
  themeList: typeof themes,
  namePrefix: string,
  maxCount?: number,
  includeThemeName = true,
): CvTemplateMeta[] {
  const items: CvTemplateMeta[] = [];
  for (const layoutId of layouts) {
    for (const theme of themeList) {
      const slug = slugify([category, layoutId, theme.key]);
      items.push({
        id: slug,
        slug,
        name: includeThemeName
          ? `${namePrefix} ${theme.name} — ${LAYOUT_LABELS[layoutId]}`
          : `${namePrefix} — ${LAYOUT_LABELS[layoutId]}`,
        category,
        priceFcfa: PRICE_FCFA[category],
        layoutId,
        theme,
        supportsPhoto: true,
      });
    }
  }
  return maxCount ? items.slice(0, maxCount) : items;
}

// 3 mises en page × 17 thèmes, plafonné à 50 modèles
export const standardCvCatalog = buildCategory("STANDARD", standardLayouts, themes, "CV Standard", 50);

// 8 mises en page × 8 thèmes = 64 modèles (voir docs/ROADMAP.md : on limite
// volontairement le nombre de couleurs par mise en page pour que la
// répétition d'une même structure recolorée reste peu visible — préférer
// ajouter de nouvelles mises en page plutôt que multiplier les couleurs).
export const premiumCvCatalog = buildCategory("PREMIUM", premiumLayouts, themes.slice(0, 8), "CV Premium");

// 3 mises en page × 17 nuances de gris strictement achromatiques (jamais une
// vraie teinte, voir docs/ROADMAP.md, décision "CV ATS monochromes"),
// plafonné à 50 modèles pour tenir l'engagement de volume pris avec
// l'utilisateur — un vrai CV ATS reste noir/gris sur blanc, la couleur ne
// varie donc qu'en nuance, jamais en teinte.
export const atsCvCatalog = buildCategory("ATS", atsLayouts, atsThemes, "CV ATS", 50);

// 3 mises en page × 5 nuances de gris = 15 modèles (même principe, volume
// plus modeste car non couvert par l'engagement des 50/100/50).
export const germanAtsCvCatalog = buildCategory(
  "GERMAN_ATS",
  germanAtsLayouts,
  atsThemes.slice(0, 5),
  "CV Allemagne (ATS)",
);

export const allCvTemplates: CvTemplateMeta[] = [
  ...standardCvCatalog,
  ...premiumCvCatalog,
  ...atsCvCatalog,
  ...germanAtsCvCatalog,
];

export function getCvTemplateBySlug(slug: string): CvTemplateMeta | undefined {
  return allCvTemplates.find((t) => t.slug === slug);
}

export function getCvTemplatesByCategory(category: CvCategory): CvTemplateMeta[] {
  return allCvTemplates.filter((t) => t.category === category);
}

// 10 layouts × 10 thèmes = 100 modèles de lettre de motivation (inchangé)
export const coverLetterCatalog: CoverLetterTemplateMeta[] = coverLetterLayouts.flatMap(
  (layout) =>
    themes.slice(0, 10).map((theme) => {
      const slug = slugify(["lm", layout.key, theme.key]);
      return {
        id: slug,
        slug,
        name: `Lettre ${theme.name} — ${layout.key.split("-").slice(1).join(" ")}`,
        priceFcfa: COVER_LETTER_PRICE_FCFA,
        layout,
        theme,
      };
    }),
);

export function getCoverLetterBySlug(slug: string): CoverLetterTemplateMeta | undefined {
  return coverLetterCatalog.find((t) => t.slug === slug);
}

// 5 mises en page × 7 nuances de gris strictement achromatiques (même
// palette ATS que les CV Allemagne, voir src/lib/cv/themes.ts) = 35 modèles,
// comme demandé par l'utilisateur.
export const bewerbungsbriefCatalog: BewerbungsbriefTemplateMeta[] = bewerbungsbriefLayouts.flatMap((layoutId) =>
  atsThemes.slice(0, 7).map((theme) => {
    const slug = slugify(["bb", layoutId, theme.key]);
    return {
      id: slug,
      slug,
      name: `Bewerbungsbrief ${theme.name} — ${BB_LAYOUT_LABELS[layoutId]}`,
      priceFcfa: BEWERBUNGSBRIEF_PRICE_FCFA,
      layoutId,
      theme,
    };
  }),
);

export function getBewerbungsbriefBySlug(slug: string): BewerbungsbriefTemplateMeta | undefined {
  return bewerbungsbriefCatalog.find((t) => t.slug === slug);
}

export { getThemeByKey };
