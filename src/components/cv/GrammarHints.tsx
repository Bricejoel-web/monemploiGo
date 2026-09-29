"use client";

import { useEffect, useRef, useState } from "react";
import { grammarSuggestionsAction } from "@/lib/documents/grammar-actions";

/**
 * Suggestions sous un champ de texte : « Vouliez-vous écrire « j'étais
 * chargé » ? [Corriger] ». Le client reste libre de les ignorer.
 */
export function GrammarHints({
  text,
  language,
  onApply,
  onCountChange,
  labels,
}: {
  text: string;
  /** Langue du document ("fr" uniquement vérifié pour l'instant). */
  language: string;
  onApply: (corrected: string) => void;
  /** Nombre de suggestions, pour l'encadré « À vérifier avant de payer ». */
  onCountChange?: (count: number) => void;
  labels: { grammarHint: string; grammarInsteadOf: string; grammarFix: string };
}) {
  // Suggestions associées au texte pour lequel elles ont été calculées : dès
  // que le client retape, elles disparaissent jusqu'à la vérification
  // suivante (« Corriger » ne s'applique jamais à un texte qui a changé).
  const [checked, setChecked] = useState<{ text: string; issues: { wrong: string; fix: string }[] }>({ text: "", issues: [] });

  useEffect(() => {
    let cancelled = false;
    // Petite attente : on vérifie quand le client marque une pause, pas à chaque lettre.
    const timer = setTimeout(async () => {
      const issues = language === "fr" && text.trim() ? await grammarSuggestionsAction(text, language).catch(() => []) : [];
      if (cancelled) return;
      setChecked({ text, issues });
      onCountChange?.(issues.length);
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, language]);

  // Champ retiré (expérience supprimée…) : il ne compte plus dans l'encadré.
  // Référence stable : la fonction reçue change à chaque rendu du parent,
  // l'effet ne doit s'exécuter qu'au démontage.
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  });
  useEffect(() => () => onCountChangeRef.current?.(0), []);

  const issues = checked.text === text ? checked.issues : [];
  if (issues.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {issues.map((issue) => (
        <li key={issue.wrong} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          <span>
            {labels.grammarHint} « <strong>{issue.fix}</strong> » <span className="opacity-70">({labels.grammarInsteadOf} « {issue.wrong} »)</span> ?
          </span>
          <button
            type="button"
            onClick={() => onApply(text.replace(issue.wrong, issue.fix))}
            className="rounded-full bg-amber-600 px-2.5 py-0.5 font-semibold text-white hover:bg-amber-700"
          >
            {labels.grammarFix}
          </button>
        </li>
      ))}
    </ul>
  );
}
