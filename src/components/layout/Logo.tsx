import Link from "next/link";
import type { Locale } from "@/i18n/config";

// Icône "Aube" — lever de soleil sur un horizon, choisie parmi les 5
// propositions présentées à l'utilisateur. Même tracé que src/app/icon.svg
// (favicon), gardés en JSX ici pour un rendu net et sans requête réseau
// dans l'en-tête du site.
//
// `gradientId` : à rendre unique quand plusieurs logos sont dans la même page
// et que l'un d'eux peut être masqué (display: none) — sinon le navigateur
// utilise le dégradé du logo masqué et l'autre n'affiche que le trait gris.
export function LogoMark({ size = 28, gradientId = "monemploigo-logo-gradient" }: { size?: number; gradientId?: string }) {
  const fill = `url(#${gradientId})`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" role="img">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f2994a" />
          <stop offset="1" stopColor="#eb5757" />
        </linearGradient>
      </defs>
      <rect x="8" y="70" width="84" height="8" rx="4" fill="#8a8580" />
      <path d="M50 26 A30 30 0 0 1 80 58 H20 A30 30 0 0 1 50 26 Z" fill={fill} />
      <line x1="50" y1="4" x2="50" y2="15" stroke={fill} strokeWidth="7" strokeLinecap="round" />
      <line x1="21" y1="15" x2="29" y2="24" stroke={fill} strokeWidth="7" strokeLinecap="round" />
      <line x1="79" y1="15" x2="71" y2="24" stroke={fill} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ locale, siteName }: { locale: Locale; siteName: string }) {
  return (
    <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark size={26} />
      <span className="text-[17px]">
        <span className="text-[#16324f] dark:text-white">{siteName.replace(/go$/i, "")}</span>
        <span className="font-bold text-[#eb5757]">Go</span>
      </span>
    </Link>
  );
}
