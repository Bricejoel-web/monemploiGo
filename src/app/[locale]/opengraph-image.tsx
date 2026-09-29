import { ImageResponse } from "next/og";

// Image de partage (WhatsApp, Facebook, LinkedIn, X…) héritée par toutes
// les pages : identité du site et promesse, sans aucun chiffre ni avis.
export const alt = "monemploiGo — CV et lettres de motivation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Logo du site (src/app/icon.svg, tel qu'il s'affiche : 2 rayons).
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f2994a"/><stop offset="1" stop-color="#eb5757"/></linearGradient></defs><rect x="8" y="70" width="84" height="8" rx="4" fill="#8a8580"/><path d="M50 26 A30 30 0 0 1 80 58 H20 A30 30 0 0 1 50 26 Z" fill="url(#g)"/><line x1="21" y1="15" x2="29" y2="24" stroke="#f2994a" stroke-width="7" stroke-linecap="round"/><line x1="79" y1="15" x2="71" y2="24" stroke="#eb5757" stroke-width="7" stroke-linecap="round"/></svg>`;

const TEXT = {
  fr: { title: "Votre CV et votre lettre de motivation, prêts en quelques minutes", subtitle: "Standard · Premium · ATS · CV allemand — paiement Mobile Money" },
  en: { title: "Your CV and cover letter, ready in minutes", subtitle: "Standard · Premium · ATS · German CV — Mobile Money payment" },
};

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = TEXT[locale === "en" ? "en" : "fr"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "#16324f",
          color: "#ffffff",
          borderBottom: "14px solid #eb5757",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse */}
          <img src={`data:image/svg+xml;base64,${Buffer.from(LOGO).toString("base64")}`} width={96} height={96} alt="" />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>
            <span>monemploi</span>
            <span style={{ color: "#eb5757" }}>Go</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>{t.title}</div>
          <div style={{ fontSize: 30, color: "#f2994a" }}>{t.subtitle}</div>
        </div>
      </div>
    ),
    size,
  );
}
