"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ErrorCard } from "@/components/layout/ErrorCard";

// Filet de secours ultime, si l'erreur touche la mise en page racine
// elle-même (au-delà de src/app/[locale]/error.tsx, qui ne couvre que
// l'intérieur d'une locale). Ce fichier remplace entièrement <html>/<body> :
// styles en ligne uniquement (voir ErrorCard), pour rester lisible quelle
// que soit la cause du problème.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = usePathname()?.startsWith("/en") ? "en" : "fr";
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body style={{ margin: 0, background: "#efe6d8" }}>
        <ErrorCard locale={locale} digest={error.digest} onRetry={reset} />
      </body>
    </html>
  );
}
