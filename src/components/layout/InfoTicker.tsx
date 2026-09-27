"use client";

import { useState, useSyncExternalStore } from "react";
import { MegaphoneIcon, PauseIcon, PlayIcon, CloseIcon } from "@/components/home/icons";

export type TickerKind = "info" | "tip" | "advice";

export interface TickerItem {
  kind: TickerKind;
  text: string;
}

const KIND_STYLES: Record<TickerKind, string> = {
  info: "bg-gradient-to-r from-[#f2994a] to-[#eb5757] text-white",
  tip: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/40",
  advice: "bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/40",
};

// Masquage valable pour la visite en cours uniquement (sessionStorage) : la
// bande porte des informations importantes (durée de conservation des
// documents), elle doit réapparaître à la visite suivante.
const HIDDEN_KEY = "monemploigo_ticker_hidden";
const hiddenListeners = new Set<() => void>();
// Repli si le stockage est indisponible (navigation privée stricte...) : la
// bande reste masquée jusqu'au rechargement de la page.
let hiddenFallback = false;

function subscribeHidden(listener: () => void) {
  hiddenListeners.add(listener);
  return () => {
    hiddenListeners.delete(listener);
  };
}

function readHidden(): boolean {
  if (hiddenFallback) return true;
  try {
    return sessionStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function hide() {
  hiddenFallback = true;
  try {
    sessionStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    // Le repli en mémoire suffit.
  }
  hiddenListeners.forEach((listener) => listener());
}

// Vitesse constante quel que soit le nombre de messages : la durée d'un
// tour est proportionnelle à la longueur totale du texte.
const SECONDS_PER_CHAR = 0.16;
const MIN_DURATION_S = 40;

function TickerCopy({
  items,
  kindLabels,
  duplicate,
}: {
  items: TickerItem[];
  kindLabels: Record<TickerKind, string>;
  duplicate?: boolean;
}) {
  return (
    <ul className={`ticker-copy shrink-0 ${duplicate ? "ticker-copy-duplicate" : ""}`} aria-hidden={duplicate || undefined}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 whitespace-nowrap pr-10 text-[13px] text-white/90">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${KIND_STYLES[item.kind]}`}>
            {kindLabels[item.kind]}
          </span>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

export function InfoTicker({
  items,
  label,
  regionLabel,
  kindLabels,
  pauseLabel,
  playLabel,
  closeLabel,
}: {
  items: TickerItem[];
  label: string;
  regionLabel: string;
  kindLabels: Record<TickerKind, string>;
  pauseLabel: string;
  playLabel: string;
  closeLabel: string;
}) {
  const [paused, setPaused] = useState(false);
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);

  if (hidden || items.length === 0) return null;

  const totalChars = items.reduce((sum, item) => sum + item.text.length + kindLabels[item.kind].length, 0);
  const duration = Math.max(MIN_DURATION_S, Math.round(totalChars * SECONDS_PER_CHAR));

  return (
    <section
      aria-label={regionLabel}
      className={`print-hide relative border-b border-white/10 bg-[#16324f] text-white ${paused ? "ticker-paused" : ""}`}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#16324f] via-[#f2994a] to-[#eb5757]" />
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          <MegaphoneIcon className="h-4 w-4 text-[#f2994a]" />
          <span className="hidden sm:inline">{label}</span>
        </span>

        <div className="ticker-viewport min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2994a]" tabIndex={0}>
          <div className="ticker-track" style={{ ["--ticker-duration" as string]: `${duration}s` }}>
            <TickerCopy items={items} kindLabels={kindLabels} />
            <TickerCopy items={items} kindLabels={kindLabels} duplicate />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? playLabel : pauseLabel}
            title={paused ? playLabel : pauseLabel}
            className="ticker-pause-button h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {paused ? <PlayIcon className="h-3.5 w-3.5" /> : <PauseIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={hide}
            aria-label={closeLabel}
            title={closeLabel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
