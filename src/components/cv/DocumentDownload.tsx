"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, DownloadIcon, WarningIcon } from "@/components/home/icons";

type State = "idle" | "preparing" | "done";

// Un simple lien (et non un téléchargement en JavaScript) : c'est la forme
// la mieux comprise par tous les navigateurs, y compris ceux intégrés à
// WhatsApp ou Facebook. Le serveur répond par le fichier PDF lui-même ; il
// dépose en même temps un petit cookie `pdf_pret` que l'on surveille ici
// pour savoir quand retirer l'indicateur « Préparation… ».
export function DocumentDownload({
  documentId,
  locale,
  failed,
  labels,
}: {
  documentId: string;
  locale: string;
  /** Le serveur n'a pas pu fabriquer le PDF (retour avec ?pdf=erreur). */
  failed: boolean;
  labels: { button: string; preparing: string; done: string; again: string; error: string; print: string };
}) {
  const [state, setState] = useState<State>("idle");
  const [token, setToken] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    const t = Math.random().toString(36).slice(2, 12);
    setToken(t);
    setState("preparing");
    const startedAt = Date.now();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (document.cookie.includes(`pdf_pret=${t}`)) {
        setState("done");
        if (timer.current) clearInterval(timer.current);
      } else if (Date.now() - startedAt > 60_000) {
        // Sans nouvelles au bout d'une minute : on rend la main.
        setState("idle");
        if (timer.current) clearInterval(timer.current);
      }
    }, 400);
  };

  const href = `/api/documents/${documentId}/pdf?lang=${locale}${token ? `&t=${token}` : ""}`;

  return (
    <div className="flex flex-col items-stretch gap-3">
      {failed && state === "idle" && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/70 bg-red-50 p-3 text-left text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {labels.error}
        </p>
      )}

      {state === "preparing" ? (
        <div role="status" className="flex items-center justify-center gap-3 rounded-full bg-black/5 px-6 py-4 text-base font-semibold dark:bg-white/10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          {labels.preparing}
        </div>
      ) : (
        <a
          href={`/api/documents/${documentId}/pdf?lang=${locale}`}
          onClick={(event) => {
            // Le lien réel porte le jeton de suivi (généré au clic).
            event.preventDefault();
            start();
          }}
          className="btn-shine flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#eb5757]/30 transition-transform active:scale-[0.98]"
        >
          <DownloadIcon className="h-5 w-5" />
          {state === "done" ? labels.again : labels.button}
        </a>
      )}
      {/* Déclenche le téléchargement avec le jeton, une fois l'état « préparation » affiché. */}
      {state === "preparing" && <DownloadTrigger href={href} />}

      {state === "done" && (
        <p role="status" className="flex items-start justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {labels.done}
        </p>
      )}

      {failed && state === "idle" && (
        <button type="button" onClick={() => window.print()} className="text-sm font-semibold text-black/60 underline dark:text-white/60">
          {labels.print}
        </button>
      )}
    </div>
  );
}

function DownloadTrigger({ href }: { href: string }) {
  useEffect(() => {
    window.location.href = href;
  }, [href]);
  return null;
}
