"use client";

import { useEffect } from "react";

// Filet de secours ultime, si l'erreur touche la mise en page racine
// elle-même (au-delà de src/app/[locale]/error.tsx, qui ne couvre que
// l'intérieur d'une locale). Ce fichier remplace entièrement <html>/<body> :
// styles en ligne uniquement, jamais de classes Tailwind ni de dépendance
// externe, pour rester lisible quelle que soit la cause du problème.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#efe6d8",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#fbfaf8",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>monemploiGo — Une erreur est survenue</h1>
          <p style={{ fontSize: 14, color: "#4a453f", margin: "0 0 20px", lineHeight: 1.5 }}>
            Quelque chose s&apos;est mal passé. Réessayez, ou revenez plus tard.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "linear-gradient(to right, #f2994a, #eb5757)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
