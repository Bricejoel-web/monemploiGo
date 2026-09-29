"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const A4_WIDTH_PX = 794;

/**
 * Aperçu réduit pour tenir dans la largeur de l'écran : sur téléphone, la
 * page A4 (794 px) s'affichait en taille réelle et débordait, sans moyen de
 * la voir en entier. Le zoom passe par une variable CSS appliquée seulement
 * à l'écran (classe `fit-to-screen`, globals.css) : à l'impression, le
 * document garde toujours sa taille A4 réelle.
 */
export function DocumentPreviewFit({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const available = container.clientWidth;
      if (available <= 0) return;
      const next = Math.min(1, (available / A4_WIDTH_PX) * 0.98);
      setZoom((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div className="fit-to-screen mx-auto w-fit" style={{ ["--fit-zoom" as string]: zoom }}>
        {children}
      </div>
    </div>
  );
}
