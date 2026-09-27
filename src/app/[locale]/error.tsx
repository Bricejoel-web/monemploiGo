"use client";

import { useEffect } from "react";

// Filet de secours pour toute erreur de rendu non interceptée (ex. une API
// navigateur absente sur un vieux téléphone) : sans ce fichier, Next.js
// affiche son HTML de secours minimal et totalement non stylé. Styles en
// ligne (jamais de classes Tailwind) : si le problème vient justement du
// chargement de la feuille de style, cette page doit rester lisible malgré
// tout — elle ne peut donc dépendre de rien d'externe.
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
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
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Une erreur est survenue</h1>
        <p style={{ fontSize: 14, color: "#4a453f", margin: "0 0 20px", lineHeight: 1.5 }}>
          Quelque chose s&apos;est mal passé lors de l&apos;affichage de cette page. Réessayez, ou revenez à
          l&apos;accueil.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- volontaire : un lien HTML classique reste fiable même si le routeur client est en cause dans l'erreur */}
          <a
            href="/"
            style={{
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 999,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              color: "#1a1a1a",
              textDecoration: "none",
            }}
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
