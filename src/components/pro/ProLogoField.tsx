"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateProLogo, type ProLogoState } from "@/lib/pro/settings-actions";
import { ProLogo } from "./ProLogo";

const SIZE = 256;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
// Le serveur refuse au-delà de 150 000 octets (LOGO_MAX_BYTES) : marge
// pour l'encodage base64 de la data URL.
const MAX_DATA_URL_LENGTH = 190_000;

/**
 * Réduit l'image à 256 × 256 px (proportions conservées, sans recadrage)
 * avant l'envoi : WebP si le navigateur sait l'encoder (transparence
 * conservée), sinon PNG, puis JPEG sur fond blanc si c'est encore trop lourd.
 */
async function resizeLogo(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(SIZE / bitmap.width, SIZE / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d")!;
  context.drawImage(bitmap, (SIZE - width) / 2, (SIZE - height) / 2, width, height);

  let url = canvas.toDataURL("image/webp", 0.9);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/png");
  if (url.length > MAX_DATA_URL_LENGTH) {
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, SIZE, SIZE);
    url = canvas.toDataURL("image/jpeg", 0.85);
  }
  return url;
}

export function ProLogoField({ companyName, logoDataUrl }: { companyName: string; logoDataUrl: string | null }) {
  const [state, action, pending] = useActionState<ProLogoState, FormData>(updateProLogo, undefined);
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");

  const send = (fields: Record<string, string>) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    startTransition(() => action(data));
  };

  const choose = async (file: File | undefined) => {
    setLocalError("");
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setLocalError("Format non accepté : choisissez une image PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Image trop lourde (5 Mo au maximum).");
      return;
    }
    try {
      send({ logo: await resizeLogo(file) });
    } catch {
      setLocalError("Cette image n'a pas pu être lue. Essayez un autre fichier.");
    }
  };

  const error = localError || state?.error;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <ProLogo companyName={companyName} logoDataUrl={logoDataUrl} size={72} />
      <div className="flex flex-col gap-2">
        <input
          ref={input}
          id="pro-logo"
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(event) => {
            void choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => input.current?.click()}
            className="rounded-full bg-[#16324f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4470] disabled:opacity-60 dark:bg-white dark:text-[#16324f]"
          >
            {pending ? "Enregistrement…" : logoDataUrl ? "Changer le logo" : "Ajouter un logo"}
          </button>
          {logoDataUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={() => send({ remove: "1" })}
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
            >
              Retirer le logo
            </button>
          )}
        </div>
        <p className="text-xs text-black/55 dark:text-white/55">
          Facultatif. PNG, JPEG ou WebP. Affiché uniquement dans votre espace Pro, jamais sur les documents de vos candidats.
        </p>
        {error && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {state?.saved && !error && (
          <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">
            Modification enregistrée.
          </p>
        )}
      </div>
    </div>
  );
}
