// Pictogrammes du parrainage, dessinés en SVG (jamais d'émoji en guise
// d'icône, décision de l'utilisateur du 2026-10-05).

type IconProps = { className?: string };

export function FlagCameroon({ className = "h-5 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10`} aria-hidden="true">
      <rect width="10" height="20" fill="#007a5e" />
      <rect x="10" width="10" height="20" fill="#ce1126" />
      <rect x="20" width="10" height="20" fill="#fcd116" />
      <path d="M15 6.2l1.06 3.26h3.43l-2.78 2.02 1.06 3.26L15 12.72l-2.77 2.02 1.06-3.26-2.78-2.02h3.43z" fill="#fcd116" />
    </svg>
  );
}

export function FlagGermany({ className = "h-5 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10`} aria-hidden="true">
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#dd0000" />
      <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
    </svg>
  );
}

// Drapeau du Canada simplifié (bandes rouges et feuille d'érable stylisée).
export function FlagCanada({ className = "h-5 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 40 20" className={`${className} shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10`} aria-hidden="true">
      <rect width="40" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#d52b1e" />
      <rect x="30" width="10" height="20" fill="#d52b1e" />
      <polygon
        fill="#d52b1e"
        points="20,3.2 21.2,5.6 22.6,5.1 22.2,8.1 24.3,6.4 24.8,7.6 26.6,7.2 26,9.1 26.9,9.6 23.4,12.4 23.8,13.6 20.4,13.2 20.5,16.6 19.5,16.6 19.6,13.2 16.2,13.6 16.6,12.4 13.1,9.6 14,9.1 13.4,7.2 15.2,7.6 15.7,6.4 17.8,8.1 17.4,5.1 18.8,5.6"
      />
    </svg>
  );
}

export function GiftIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="8" width="18" height="5" rx="1" />
      <path d="M5 13v7h14v-7M12 8v12M12 8c-1.5-3-5-3.5-5-1.25C7 8.5 12 8 12 8Zm0 0c1.5-3 5-3.5 5-1.25C17 8.5 12 8 12 8Z" />
    </svg>
  );
}

export function CopyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function ChatIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19L4 20Z" />
    </svg>
  );
}
