import type { ReactNode } from "react";

// Regroupe les modèles d'un catalogue par mise en page, chaque groupe
// défilant horizontalement au doigt (façon Play Store : on glisse à
// l'intérieur d'une section pour voir les variantes de couleur, puis on
// défile la page vers le bas pour passer à la mise en page suivante).
// Réservé au mobile — la grille classique reprend le dessus dès `sm:`.
export function CatalogSwipeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 px-6 text-sm font-semibold text-black/70 dark:text-white/70">{title}</h3>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1">{children}</div>
    </div>
  );
}
