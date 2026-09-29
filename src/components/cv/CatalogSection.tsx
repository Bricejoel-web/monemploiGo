import type { ReactNode } from "react";

/**
 * Une famille de modèles d'un catalogue (même mise en page, couleurs
 * différentes), rendue UNE seule fois pour tous les écrans : défilement
 * horizontal au doigt sur téléphone (façon Play Store), grille dès `sm:`.
 *
 * Remplace l'ancien double rendu (grille masquée sur téléphone + carrousel
 * masqué sur ordinateur) : chaque aperçu de CV était fabriqué deux fois, ce
 * qui doublait le poids de la page (jusqu'à 2,4 Mo de HTML), le nombre
 * d'images téléchargées et le travail du téléphone (Lighthouse mobile :
 * 20/100 et 7 s de blocage sur le catalogue Premium). Le titre de famille
 * sert aussi d'intertitre (H2) pour la lecture et le référencement.
 */
export function CatalogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 px-6 text-sm font-semibold text-black/70 sm:text-base dark:text-white/70">{title}</h2>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

/**
 * Classes de largeur des cartes de modèle : carte fixe qui s'aligne au doigt
 * sur téléphone, pleine largeur de colonne dès `sm:`. `content-visibility`
 * laisse le navigateur ignorer le rendu des cartes hors écran jusqu'à ce
 * qu'on s'en approche (gros gain de temps de calcul sur téléphone) ;
 * `contain-intrinsic-size` réserve leur hauteur approximative pour éviter
 * tout décalage de mise en page. Sans effet (et sans risque) sur les
 * navigateurs qui ne connaissent pas ces propriétés.
 */
export const CATALOG_CARD_CLASSES =
  "w-72 shrink-0 snap-start sm:w-full sm:shrink [content-visibility:auto] [contain-intrinsic-size:auto_560px]";
