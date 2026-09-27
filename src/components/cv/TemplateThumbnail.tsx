"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// A4 à 96dpi ≈ 794 × 1123px. On réduit le rendu réel du document (même
// composant que l'aperçu plein format) pour obtenir une vignette fidèle,
// sans dupliquer la mise en page pour chaque catalogue.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
// Agrandi (0.27 → 0.36) à la demande de l'utilisateur : les aperçus de
// modèles restaient lisibles mais trop petits pour distinguer les détails
// d'une mise en page depuis un téléphone. Les grilles des pages catalogue
// passent aussi à 1 colonne sur mobile pour laisser la place à cette
// vignette plus grande sans provoquer de débordement.
const THUMB_SCALE = 0.36;

export function TemplateThumbnail({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(THUMB_SCALE);

  // Le contenu réel (mêmes composants que l'aperçu plein format) utilise
  // `min-height`, pas une hauteur fixe : un modèle dont le texte de
  // démonstration dépasse une page A4 pleine peut donc être plus haut que
  // A4_HEIGHT_PX. Sans cette mesure, l'excédent était simplement rogné par
  // le `overflow-hidden` du cadre — un CV coupé en bas dans le catalogue.
  // On mesure la hauteur réelle (non réduite) et on réduit l'échelle en
  // conséquence pour que le document tienne toujours entièrement dans la
  // vignette, quitte à afficher un peu de marge sur les côtés.
  // `useLayoutEffect` (et non `useEffect`) : ce composant s'appuie sur
  // `useAdaptiveFill` (qui agrandit un contenu trop court via `zoom`,
  // *avant* peinture, dans son propre `useLayoutEffect`) — mesurer dans la
  // même phase synchrone garantit qu'on lit toujours la hauteur finale
  // déjà ajustée, sans décalage d'une image affichée dès le premier rendu.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const actualHeight = el.scrollHeight;
      const fitScale = actualHeight > A4_HEIGHT_PX ? (A4_HEIGHT_PX / actualHeight) * THUMB_SCALE : THUMB_SCALE;
      setScale((prev) => (Math.abs(prev - fitScale) > 0.001 ? fitScale : prev));
    };

    measure();
    // `ResizeObserver` est absent des très vieux navigateurs (WebView Android
    // anciens, fréquents sur les téléphones d'entrée de gamme) — sans ce
    // filet, l'appel plantait immédiatement dans cet effet, et sans page
    // d'erreur personnalisée (voir error.tsx), Next.js repliait toute la page
    // sur son HTML de secours minimal, non stylé. La mesure initiale
    // ci-dessus reste faite ; seul le réajustement dynamique est perdu.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offsetX = (A4_WIDTH_PX * THUMB_SCALE - A4_WIDTH_PX * scale) / 2;

  return (
    <div
      className="relative overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/10"
      style={{ width: A4_WIDTH_PX * THUMB_SCALE, height: A4_HEIGHT_PX * THUMB_SCALE }}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0"
        style={{ width: A4_WIDTH_PX, transform: `translateX(${offsetX}px) scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
