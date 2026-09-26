"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Mesure la hauteur réelle du contenu d'un CV/lettre et l'agrandit
 * (police, espacements, éléments décoratifs — via CSS `zoom`) si le
 * contenu est plus court que la page A4, pour qu'un CV avec peu
 * d'information occupe quand même toute la page au lieu de laisser un
 * vide en bas. Ne réduit jamais le contenu (un CV trop long déborde sur
 * une page suivante normalement, plutôt que d'être écrasé).
 */
export function useAdaptiveFill<T extends HTMLElement>(
  targetHeightPx: number,
  deps: unknown[] = [],
  maxScale = 1.4,
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.zoom = "1";
    // Un cadre suffit : on force un reflow avant de mesurer la hauteur naturelle.
    const naturalHeight = el.scrollHeight;

    if (naturalHeight > 0 && naturalHeight < targetHeightPx) {
      const scale = Math.min(maxScale, targetHeightPx / naturalHeight);
      el.style.zoom = String(scale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHeightPx, maxScale, ...deps]);

  return ref;
}
