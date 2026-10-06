"use client";

// Carte des pages d'erreur ([locale]/error.tsx et global-error.tsx).
// Styles en ligne (jamais de classes Tailwind) : si le problème vient du
// chargement de la feuille de style, la page doit rester lisible. Icône
// dessinée (pas d'émoji). Le code de référence (digest de Next.js) permet de
// retrouver l'erreur exacte dans le journal de Vercel.

const TEXT = {
  fr: {
    title: "Une erreur est survenue",
    body: "Quelque chose s'est mal passé lors de l'affichage de cette page. Réessayez, ou revenez à l'accueil.",
    retry: "Réessayer",
    home: "Accueil",
    code: "Code de l'erreur",
    help: "Le problème continue ? Écrivez-nous en indiquant ce code :",
  },
  en: {
    title: "Something went wrong",
    body: "An error occurred while displaying this page. Please try again, or go back to the home page.",
    retry: "Try again",
    home: "Home",
    code: "Error code",
    help: "Still not working? Write to us and include this code:",
  },
} as const;

const CONTACT = "monemploigo.contact@gmail.com";

export function ErrorCard({ locale, digest, onRetry }: { locale: "fr" | "en"; digest?: string; onRetry: () => void }) {
  const t = TEXT[locale];
  const mail = `mailto:${CONTACT}?subject=${encodeURIComponent(`${t.code} ${digest ?? ""}`.trim())}`;
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
          maxWidth: 440,
          width: "100%",
          background: "#fbfaf8",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#eb5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{t.title}</h1>
        <p style={{ fontSize: 14, color: "#4a453f", margin: "0 0 20px", lineHeight: 1.5 }}>{t.body}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onRetry}
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
            {t.retry}
          </button>
          <a
            href={`/${locale}`}
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
            {t.home}
          </a>
        </div>
        <p style={{ fontSize: 12, color: "#5f5a52", margin: "20px 0 0", lineHeight: 1.5 }}>
          {t.help}{" "}
          <a href={mail} style={{ color: "#c94f30", fontWeight: 600 }}>
            {CONTACT}
          </a>
          {digest && (
            <>
              <br />
              {t.code} : <code style={{ fontFamily: "monospace", userSelect: "all" }}>{digest}</code>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
