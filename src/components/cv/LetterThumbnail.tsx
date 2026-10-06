"use client";

import { useMemo } from "react";
import { getSampleCoverLetterData } from "@/lib/cv/sample-data";
import type { CoverLetterLayoutConfig, CvTheme } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { CoverLetterRenderer } from "./CoverLetterRenderer";
import { TemplateThumbnail } from "./TemplateThumbnail";

/**
 * Vignette d'un modèle de lettre, fabriquée dans le navigateur à partir de
 * la lettre d'exemple (une seule, calculée ici). Le serveur n'envoie que la
 * mise en page et le thème du modèle : avant, il envoyait la lettre
 * complète de chacun des 100 modèles (page de 636 Ko).
 */
export function LetterThumbnail({ layout, theme, locale }: { layout: CoverLetterLayoutConfig; theme: CvTheme; locale: Locale }) {
  const sample = useMemo(() => getSampleCoverLetterData(locale), [locale]);
  return (
    <TemplateThumbnail>
      <CoverLetterRenderer data={sample} layout={layout} theme={theme} locale={locale} />
    </TemplateThumbnail>
  );
}
