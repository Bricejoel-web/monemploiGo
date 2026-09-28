"use client";

import { useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { CameraIcon } from "@/components/home/icons";

/**
 * Ajout de la photo du CV. Remplace l'ancienne case "Inclure ma photo" +
 * sélecteur de fichier natif, que les utilisateurs ne remarquaient pas :
 * tant qu'il n'y a pas de photo, le bloc se présente comme un appel à
 * l'action (cadre en pointillés aux couleurs du site, avatar animé, bouton
 * en dégradé) ; une fois la photo choisie, il affiche la miniature, les
 * boutons Changer / Retirer et le réglage de taille.
 * Photo présente = photo affichée sur le CV (plus de case à cocher séparée).
 */
export function PhotoPicker({
  photoDataUrl,
  photoScale,
  error,
  onFile,
  onRemove,
  onScaleChange,
  labels,
}: {
  photoDataUrl: string | null | undefined;
  photoScale: number;
  error: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  onScaleChange: (scale: number) => void;
  labels: Dictionary["editor"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.click();
  const hasPhoto = Boolean(photoDataUrl);

  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl p-5 shadow-sm ${
        hasPhoto
          ? "border border-black/10 bg-[#fbfaf8] dark:border-white/10 dark:bg-white/[0.06]"
          : "border-2 border-dashed border-[#eb5757]/45 bg-gradient-to-br from-[#f2994a]/10 to-[#eb5757]/10"
      }`}
    >
      <h2 className="text-base font-semibold tracking-tight">{labels.photo}</h2>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={openPicker}
          aria-label={hasPhoto ? labels.changePhoto : labels.addPhoto}
          className="relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#eb5757]"
        >
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo utilisateur en data URL
            <img src={photoDataUrl!} alt="" className="h-20 w-20 rounded-full object-cover shadow-md ring-2 ring-white" />
          ) : (
            <>
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#eb5757]/25 motion-safe:animate-ping" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#c94f30] shadow-md ring-2 ring-[#eb5757]/40 dark:bg-white/10 dark:text-[#f2994a]">
                <CameraIcon className="h-9 w-9" />
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-lg font-bold leading-none text-white shadow ring-2 ring-white"
              >
                +
              </span>
            </>
          )}
        </button>
        <div className="min-w-0">
          <p className="font-semibold">{hasPhoto ? labels.photoAdded : labels.addPhotoTitle}</p>
          <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">{hasPhoto ? labels.photoAddedHint : labels.addPhotoHint}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        id="photoUpload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // Permet de rechoisir le même fichier après l'avoir retiré.
          e.target.value = "";
        }}
      />

      {hasPhoto ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPicker}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/80 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
            >
              <CameraIcon className="h-4 w-4" />
              {labels.changePhoto}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              {labels.removePhoto}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="photoScale" className="text-xs font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
                {labels.photoSize}
              </label>
              <span className="text-xs font-medium text-black/60 dark:text-white/60">{Math.round(photoScale * 100)}%</span>
            </div>
            <input
              id="photoScale"
              type="range"
              min={0.7}
              max={1.6}
              step={0.05}
              value={photoScale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#eb5757]/30 transition-transform hover:scale-[1.02] sm:w-auto sm:self-start"
        >
          <CameraIcon className="h-5 w-5" />
          {labels.addPhoto}
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
