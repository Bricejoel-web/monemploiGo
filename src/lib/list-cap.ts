/**
 * Plafonds d'affichage des listes (pas de pagination tant que les volumes
 * restent faibles). Chaque requête lit un élément de plus que le plafond :
 * s'il existe, la page affiche un avertissement (ListCapNotice).
 */
export const LIST_CAP = { admin: 200, commissions: 100, pro: 200 } as const;
