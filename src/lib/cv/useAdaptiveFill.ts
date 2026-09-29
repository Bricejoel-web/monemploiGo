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

    // Cadre de page (CvPageFrame) : sa hauteur minimale est celle d'une page
    // A4 à l'échelle de conception.
    const page = el.closest(".a4-page")?.firstElementChild as HTMLElement | null;
    const pageLimit = page ? parseFloat(page.style.minHeight) : NaN;
    const overflowsPage = () => Number.isFinite(pageLimit) && page!.scrollHeight > pageLimit + 0.5;

    const fit = () => {
      el.style.zoom = "1";
      // Un cadre suffit : on force un reflow avant de mesurer la hauteur naturelle.
      const naturalHeight = el.scrollHeight;
      if (!(naturalHeight > 0 && naturalHeight < targetHeightPx)) return;
      const scale = Math.min(maxScale, targetHeightPx / naturalHeight);
      el.style.zoom = String(scale);

      // `targetHeightPx` est une estimation fixe de la place laissée par le
      // reste de la page (en-tête…). Quand cette partie est plus haute que
      // prévu — p. ex. les 6 lignes de « Persönliche Daten » —, l'agrandir
      // faisait dépasser la page A4 : la dernière rubrique passait sur une
      // 2e page du PDF. On réduit alors l'agrandissement juste assez pour que
      // toute la page tienne (recherche par dichotomie).
      if (scale > 1 && overflowsPage()) {
        let fits = 1;
        let tooBig = scale;
        for (let i = 0; i < 10; i++) {
          const mid = (fits + tooBig) / 2;
          el.style.zoom = String(mid);
          if (overflowsPage()) tooBig = mid;
          else fits = mid;
        }
        el.style.zoom = String(fits);
      }
    };

    fit();
    // Les polices des CV (Google Fonts) arrivent souvent après ce premier
    // calcul : le texte prend alors un peu plus de place et le contenu
    // agrandi débordait de la page A4 — la dernière rubrique passait sur
    // une 2e page du PDF. On recalcule donc une fois les polices chargées.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHeightPx, maxScale, ...deps]);

  return ref;
}
