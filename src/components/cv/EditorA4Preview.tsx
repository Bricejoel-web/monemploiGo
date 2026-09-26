"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, WarningIcon } from "@/components/home/icons";

// A4 à 96dpi ≈ 794 × 1123px. Le zoom fixe (0.55) utilisé jusqu'ici ne
// tenait que sur les colonnes d'aperçu larges (bureau) : sur mobile, où
// cette colonne passe en pleine largeur mais reste bien plus étroite que
// 794×0.55≈437px, la page A4 débordait du cadre — cadre qui utilisait
// `overflow-hidden` (donc sans aucun moyen de faire défiler pour voir le
// reste). On mesure la largeur réellement disponible et on calcule un zoom
// qui fait toujours tenir la page entière, plafonné à 0.55 pour ne rien
// changer au rendu bureau existant.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
// Petite tolérance (arrondis/anti-aliasing) avant de considérer qu'une
// page entière supplémentaire est réellement nécessaire.
const PAGE_OVERFLOW_TOLERANCE_PX = 4;
const MAX_ZOOM = 0.55;

export function EditorA4Preview({
  children,
  pageFitsLabel,
  pageOverflowLabel,
  pageOverflowHint,
}: {
  children: ReactNode;
  pageFitsLabel: string;
  pageOverflowLabel: string;
  pageOverflowHint: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(MAX_ZOOM);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const measure = () => {
      const availableWidth = container.clientWidth;
      if (availableWidth > 0) {
        // Petite marge (2 %) pour absorber les arrondis de sous-pixel et
        // éviter un débordement d'un pixel malgré le calcul.
        const fitZoom = (availableWidth / A4_WIDTH_PX) * 0.98;
        setZoom((prev) => {
          const next = Math.min(MAX_ZOOM, fitZoom);
          return Math.abs(prev - next) > 0.001 ? next : prev;
        });
      }

      // Nombre de pages réel : indépendant du zoom d'affichage ci-dessus
      // (purement cosmétique, pour tenir dans un écran étroit) — on annule
      // temporairement le zoom de cet élément pour mesurer sa hauteur
      // naturelle, même technique que `useAdaptiveFill`. Le zoom interne
      // éventuel d'`useAdaptiveFill` (qui agrandit un contenu court pour
      // remplir une page) reste lui inchangé : il s'applique sur un élément
      // plus profond, indépendant de celui-ci.
      const previousZoom = content.style.zoom;
      content.style.zoom = "1";
      const naturalHeight = content.scrollHeight;
      content.style.zoom = previousZoom;

      const pages =
        naturalHeight > A4_HEIGHT_PX + PAGE_OVERFLOW_TOLERANCE_PX
          ? Math.ceil(naturalHeight / A4_HEIGHT_PX)
          : 1;
      setPageCount((prev) => (prev === pages ? prev : pages));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const fits = pageCount <= 1;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold ${
          fits
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        }`}
      >
        {fits ? <CheckIcon className="h-3.5 w-3.5" /> : <WarningIcon className="h-3.5 w-3.5" />}
        {fits ? pageFitsLabel : pageOverflowLabel.replace("{count}", String(pageCount))}
      </div>
      {!fits && <p className="text-xs text-black/50 dark:text-white/50">{pageOverflowHint}</p>}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-4 shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
        <div ref={containerRef}>
          <div ref={contentRef} style={{ zoom, width: "210mm" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
