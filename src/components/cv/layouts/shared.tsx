import type { CvData, CvTheme, BewerbungsbriefData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { PersonIcon } from "../icons";

export { AdaptiveZone } from "./AdaptiveZone";

export interface CvLayoutProps {
  data: CvData;
  theme: CvTheme;
  includePhoto: boolean;
  locale?: Locale;
}

export interface BewerbungsbriefLayoutProps {
  data: BewerbungsbriefData;
  theme: CvTheme;
  locale?: Locale;
}

export function PhotoCircle({
  photoDataUrl,
  size,
  ringColor = "#fff",
  ringWidth = 4,
  iconColor = "#123a63",
  bg = "#dfe9f3",
}: {
  photoDataUrl?: string | null;
  size: number;
  ringColor?: string;
  ringWidth?: number;
  iconColor?: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `${ringWidth}px solid ${ringColor}`,
        boxShadow: "0 4px 14px rgba(0,0,0,.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo utilisateur en data URL
        <img src={photoDataUrl} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <PersonIcon size={Math.round(size * 0.45)} color={iconColor} />
      )}
    </div>
  );
}

export function IconChip({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export function skillTagStyle(accent: string, accentSoft: string): React.CSSProperties {
  return {
    fontSize: "11px",
    padding: "4px 10px",
    border: `1px solid ${accentSoft}`,
    borderRadius: "999px",
    color: accent,
  };
}

/** Convertit un niveau de langue saisi librement en pourcentage approximatif
 * pour les barres de progression décoratives (utilisé par les mises en page
 * Premium qui illustrent les langues avec une jauge). */
export function levelToPct(level: string): number {
  const l = level.toLowerCase();
  if (/(maternell|natif|native|courant|fluent|c[12])/.test(l)) return 100;
  if (/(avancé|advanced|b2)/.test(l)) return 80;
  if (/(intermédiaire|intermediate|b1)/.test(l)) return 60;
  if (/(débutant|notion|beginner|a[12])/.test(l)) return 35;
  return 70;
}

export function contactList(data: CvData): string[] {
  return [data.phone, data.email, data.address].filter((v): v is string => Boolean(v));
}

// Toutes les mises en page sont dessinées dans un espace de conception fixe
// de 480×679px de large (identique aux maquettes validées avec
// l'utilisateur), puis mises à l'échelle vers la vraie taille A4
// (~794px de large à 96dpi) via `zoom` plutôt que `transform: scale`.
// C'est important : `transform` ne change que le rendu visuel, jamais la
// place réellement occupée dans la page, donc un CV plus long que prévu
// (beaucoup de texte saisi par l'utilisateur) se faisait couper net par
// `overflow: hidden` au lieu de faire grandir la page. `zoom`, lui,
// agrandit la mise en page pour de vrai : la hauteur 679px n'est qu'un
// minimum (`minHeight`), donc la page A4 s'allonge naturellement si le
// contenu déborde, exactement comme un vrai CV sur plusieurs pages.
export const DESIGN_WIDTH = 480;
export const DESIGN_HEIGHT = 679;
const REAL_WIDTH = 794;
const REAL_SCALE = REAL_WIDTH / DESIGN_WIDTH;

export function CvPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <article className="a4-page" style={{ position: "relative" }}>
      <div
        style={{
          width: DESIGN_WIDTH,
          minHeight: DESIGN_HEIGHT,
          zoom: REAL_SCALE,
        }}
      >
        {children}
      </div>
    </article>
  );
}
