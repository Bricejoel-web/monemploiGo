/**
 * Liste plafonnée : signalé clairement quand des éléments plus anciens ne
 * sont pas affichés (aucune pagination tant que les volumes restent faibles ;
 * si ce message apparaît souvent, il sera temps d'en ajouter une).
 */
export function ListCapNotice({ cap }: { cap: number }) {
  return (
    <p role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
      Affichage limité aux {cap} éléments les plus récents. Utilisez les filtres ou la recherche pour retrouver un élément plus ancien.
    </p>
  );
}
