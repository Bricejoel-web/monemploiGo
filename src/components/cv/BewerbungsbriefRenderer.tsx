import type { BewerbungsbriefData, BewerbungsbriefLayoutId, CvTheme } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { BbDinKlassisch } from "./layouts/BbDinKlassisch";
import { BbModernKopf } from "./layouts/BbModernKopf";
import { BbTabellenKopf } from "./layouts/BbTabellenKopf";
import { BbAnlagenListe } from "./layouts/BbAnlagenListe";
import { BbKompakt } from "./layouts/BbKompakt";

interface BewerbungsbriefRendererProps {
  data: BewerbungsbriefData;
  layoutId: BewerbungsbriefLayoutId;
  theme: CvTheme;
  locale?: Locale;
}

const LAYOUT_COMPONENTS = {
  "bb-din-klassisch": BbDinKlassisch,
  "bb-modern-kopf": BbModernKopf,
  "bb-tabellen-kopf": BbTabellenKopf,
  "bb-anlagen-liste": BbAnlagenListe,
  "bb-kompakt": BbKompakt,
} as const;

export function BewerbungsbriefRenderer({ data, layoutId, theme, locale = "fr" }: BewerbungsbriefRendererProps) {
  const Layout = LAYOUT_COMPONENTS[layoutId];
  return <Layout data={data} theme={theme} locale={locale} />;
}
