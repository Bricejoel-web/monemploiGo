"use client";

import type { ReactNode } from "react";

// Étiquette visible et persistante au-dessus de chaque champ — le texte à
// l'intérieur d'un champ (placeholder) disparaît dès que l'utilisateur tape,
// ce qui est un défaut d'ergonomie et d'accessibilité reconnu (l'utilisateur
// perd le repère de ce qu'il remplit, et les lecteurs d'écran l'ignorent
// souvent). Le placeholder ne doit donc servir que d'exemple de format, pas
// d'étiquette du champ.
export function Field({
  id,
  label,
  optionalLabel,
  children,
}: {
  id: string;
  label: string;
  optionalLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
        {label}
        {optionalLabel && <span className="font-normal normal-case text-black/40 dark:text-white/40"> {optionalLabel}</span>}
      </label>
      {children}
    </div>
  );
}
