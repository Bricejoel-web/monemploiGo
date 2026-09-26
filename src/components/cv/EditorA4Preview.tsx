"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// A4 à 96dpi ≈ 794px de large. Le zoom fixe (0.55) utilisé jusqu'ici ne
// tenait que sur les colonnes d'aperçu larges (bureau) : sur mobile, où
// cette colonne passe en pleine largeur mais reste bien plus étroite que
// 794×0.55≈437px, la page A4 débordait du cadre — cadre qui utilisait
// `overflow-hidden` (donc sans aucun moyen de faire défiler pour voir le
// reste). On mesure la largeur réellement disponible et on calcule un zoom
// qui fait toujours tenir la page entière, plafonné à 0.55 pour ne rien
// changer au rendu bureau existant.
const A4_WIDTH_PX = 794;
const MAX_ZOOM = 0.55;

export function EditorA4Preview({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(MAX_ZOOM);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth <= 0) return;
      // Petite marge (2 %) pour absorber les arrondis de sous-pixel et
      // éviter un débordement d'un pixel malgré le calcul.
      const fitZoom = (availableWidth / A4_WIDTH_PX) * 0.98;
      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, fitZoom);
        return Math.abs(prev - next) > 0.001 ? next : prev;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
      <div ref={containerRef}>
        <div style={{ zoom, width: "210mm" }}>{children}</div>
      </div>
    </div>
  );
}
