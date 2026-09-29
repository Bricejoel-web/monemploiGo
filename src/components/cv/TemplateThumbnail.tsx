"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// A4 à 96dpi ≈ 794 × 1123px. On réduit le rendu réel du document (même
// composant que l'aperçu plein format) pour obtenir une vignette fidèle,
// sans dupliquer la mise en page pour chaque catalogue.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
// Taille maximale de la vignette (agrandie de 0.27 à 0.36 à la demande de
// l'utilisateur, pour distinguer les détails depuis un téléphone). C'est un
// plafond, pas une taille fixe : la vignette se réduit à la largeur
// réellement disponible dans sa carte. Avec une taille fixe, la vignette
// (286px) débordait des cartes plus étroites de la grille à 4 colonnes
// (229px utiles) et le `overflow-hidden` de la carte en coupait ~30px de
// chaque côté — la colonne latérale des mises en page pleine largeur
// ("Vague Sidebar"...) devenait illisible.
const THUMB_SCALE = 0.36;

export function TemplateThumbnail({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(THUMB_SCALE);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
  // Le document réduit n'est fabriqué qu'à l'approche de l'écran. Un
  // catalogue affiche jusqu'à 64 aperçus : les calculer tous à l'ouverture
  // (rendu + mesure de hauteur ci-dessous, qui force la mise en page)
  // bloquait un téléphone 6 à 9 s (Lighthouse). Le cadre, de taille fixe,
  // est affiché tout de suite : aucun décalage de mise en page. Côté
  // serveur, le HTML ne contient donc plus le texte des CV d'exemple.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === "undefined") {
      // Très vieux navigateurs : rendu immédiat, comme avant.
      queueMicrotask(() => setVisible(true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Le contenu réel (mêmes composants que l'aperçu plein format) utilise
  // `min-height`, pas une hauteur fixe : un modèle dont le texte de
  // démonstration dépasse une page A4 pleine peut donc être plus haut que
  // A4_HEIGHT_PX. On mesure cette hauteur réelle (non réduite — `transform`
  // n'affecte pas `scrollHeight`) pour réduire l'échelle en conséquence :
  // le document tient toujours entièrement dans la vignette, quitte à
  // afficher un peu de marge sur les côtés, plutôt que d'être coupé en bas.
  // `useLayoutEffect` (et non `useEffect`) : `useAdaptiveFill` agrandit un
  // contenu trop court dans son propre `useLayoutEffect`, avant peinture —
  // mesurer dans la même phase synchrone garantit de lire la hauteur finale.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const el = contentRef.current;
    if (!frame || !el) return;

    const measure = () => {
      const availableWidth = frame.clientWidth;
      if (availableWidth > 0) {
        const next = Math.min(THUMB_SCALE, availableWidth / A4_WIDTH_PX);
        setBaseScale((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
      }
      const height = el.scrollHeight;
      setContentHeight((prev) => (prev === height ? prev : height));
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
    observer.observe(frame);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const scale = contentHeight > A4_HEIGHT_PX ? (A4_HEIGHT_PX / contentHeight) * baseScale : baseScale;
  const offsetX = (A4_WIDTH_PX * baseScale - A4_WIDTH_PX * scale) / 2;

  return (
    <div ref={frameRef} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/10"
        style={{ width: A4_WIDTH_PX * baseScale, height: A4_HEIGHT_PX * baseScale }}
      >
        {visible && (
          <div
            ref={contentRef}
            className="absolute top-0 left-0"
            style={{ width: A4_WIDTH_PX, transform: `translateX(${offsetX}px) scale(${scale})`, transformOrigin: "top left" }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
