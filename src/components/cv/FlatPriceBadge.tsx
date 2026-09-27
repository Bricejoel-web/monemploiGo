import { CheckIcon } from "@/components/home/icons";

/**
 * Prix unique d'une catégorie ("Tous les modèles à 1000 FCFA"). Chaque
 * catégorie a un seul prix (voir PRICE_FCFA dans catalog.ts) : une formule
 * du type "à partir de" laisserait croire à tort que certains modèles
 * coûtent plus cher. `label` contient le marqueur {price}, mis en gras.
 */
export function FlatPriceBadge({ label, priceFcfa }: { label: string; priceFcfa: number }) {
  const [before, after = ""] = label.split("{price}");
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20">
      <CheckIcon className="h-3 w-3 shrink-0" />
      <span>
        {before}
        <strong className="font-bold">{priceFcfa} FCFA</strong>
        {after}
      </span>
    </span>
  );
}
