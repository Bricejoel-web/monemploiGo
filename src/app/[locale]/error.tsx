"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ErrorCard } from "@/components/layout/ErrorCard";

// Filet de secours pour toute erreur de rendu non interceptée (ex. une API
// navigateur absente sur un vieux téléphone) : sans ce fichier, Next.js
// affiche son HTML de secours minimal et totalement non stylé. Texte dans la
// langue de la page, code de référence et contact : voir ErrorCard.
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorCard locale={params?.locale === "en" ? "en" : "fr"} digest={error.digest} onRetry={reset} />;
}
