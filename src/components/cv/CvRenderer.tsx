import type { CvData, CvLayoutId, CvTheme } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { StdClassique } from "./layouts/StdClassique";
import { StdDeuxColonnes } from "./layouts/StdDeuxColonnes";
import { StdBandeau } from "./layouts/StdBandeau";
import { PremCercles } from "./layouts/PremCercles";
import { PremTriangles } from "./layouts/PremTriangles";
import { PremVagues } from "./layouts/PremVagues";
import { PremPilules } from "./layouts/PremPilules";
import { PremFacettes } from "./layouts/PremFacettes";
import { PremDiagonale } from "./layouts/PremDiagonale";
import { PremBanniere } from "./layouts/PremBanniere";
import { PremVagueLaterale } from "./layouts/PremVagueLaterale";
import { AtsExecutif } from "./layouts/AtsExecutif";
import { AtsMinimal } from "./layouts/AtsMinimal";
import { AtsCompact } from "./layouts/AtsCompact";
import { DeTabellarisch } from "./layouts/DeTabellarisch";
import { DeBlockschema } from "./layouts/DeBlockschema";
import { DeKompakt } from "./layouts/DeKompakt";
import { CanadaCv } from "./canada/CanadaCv";
import { canadaModelById } from "@/lib/cv/canada/models";

interface CvRendererProps {
  data: CvData;
  layoutId: CvLayoutId;
  theme: CvTheme;
  includePhoto: boolean;
  locale?: Locale;
}

const LAYOUT_COMPONENTS = {
  "std-classique": StdClassique,
  "std-deux-colonnes": StdDeuxColonnes,
  "std-bandeau": StdBandeau,
  "prem-cercles": PremCercles,
  "prem-triangles": PremTriangles,
  "prem-vagues": PremVagues,
  "prem-pilules": PremPilules,
  "prem-facettes": PremFacettes,
  "prem-diagonale": PremDiagonale,
  "prem-banniere": PremBanniere,
  "prem-vague-laterale": PremVagueLaterale,
  "ats-executif": AtsExecutif,
  "ats-minimal": AtsMinimal,
  "ats-compact": AtsCompact,
  "de-tabellarisch": DeTabellarisch,
  "de-blockschema": DeBlockschema,
  "de-kompakt": DeKompakt,
} as const;

export function CvRenderer({ data, layoutId, theme, includePhoto, locale = "fr" }: CvRendererProps) {
  // CV Canada : moteur commun, et langue choisie pour le document plutôt que celle du site.
  const canadaModel = layoutId.startsWith("can-") ? canadaModelById(layoutId.toUpperCase()) : undefined;
  if (canadaModel) return <CanadaCv data={data} model={canadaModel} includePhoto={includePhoto} locale={data.cvLanguage ?? locale} />;
  const Layout = LAYOUT_COMPONENTS[layoutId as keyof typeof LAYOUT_COMPONENTS];
  return <Layout data={data} theme={theme} includePhoto={includePhoto} locale={locale} />;
}
