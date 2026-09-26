import type { BewerbungsbriefLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";

function Row({ label, value, muted }: { label: string; value?: string; muted: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
      <div style={{ width: 84, flexShrink: 0, fontSize: 10, color: muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10.5, flex: 1 }}>{value}</div>
    </div>
  );
}

// Variante "en-tête tableau" : expéditeur, destinataire, date et référence
// présentés en mini-tableau compact (même principe que le Row de
// DeTabellarisch.tsx pour le CV Allemagne), avant le Betreff.
export function BbTabellenKopf({ data, theme }: BewerbungsbriefLayoutProps) {
  const subject = [
    `Bewerbung um einen Ausbildungsplatz als ${data.targetProgram || "..."}`,
    data.referenceNumber ? `(Referenz: ${data.referenceNumber})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <CvPageFrame>
      <div
        style={{
          width: 480,
          minHeight: 679,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'IBM Plex Sans', sans-serif",
          color: "#1c1b1a",
          padding: "36px 44px 30px 44px",
        }}
      >
        <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 16 }}>{data.fullName || "Ihr Name"}</div>

        <div
          style={{
            border: `1px solid ${theme.textMuted}`,
            borderRadius: 4,
            padding: "12px 14px",
            marginBottom: 22,
          }}
        >
          <Row label="Absender" value={[data.address, data.phone, data.email].filter(Boolean).join(", ")} muted={theme.textMuted} />
          <Row label="Empfänger" value={data.recipientInstitution} muted={theme.textMuted} />
          <Row label="Adresse" value={data.recipientAddress} muted={theme.textMuted} />
          <Row label="Ansprechpartner" value={data.recipientContactName} muted={theme.textMuted} />
          <Row label="Ort, Datum" value={[data.city, data.date].filter(Boolean).join(", den ")} muted={theme.textMuted} />
          <Row label="Referenz" value={data.referenceNumber} muted={theme.textMuted} />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, color: theme.accent, marginBottom: 18 }}>{subject}</div>

        <div style={{ fontSize: 11.5, marginBottom: 12 }}>Sehr geehrte Damen und Herren,</div>

        <AdaptiveZone targetHeight={679 - 440} deps={[data]}>
          <p style={{ fontSize: 11.5, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{data.body}</p>
        </AdaptiveZone>

        <div style={{ marginTop: 26, fontSize: 11.5, flexShrink: 0 }}>
          Mit freundlichen Grüßen
          <br />
          <br />
          {data.fullName}
        </div>

        {data.attachments.length > 0 && (
          <div style={{ marginTop: 22, fontSize: 10.5, flexShrink: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Anlagen</div>
            <div style={{ color: theme.textMuted }}>{data.attachments.join(", ")}</div>
          </div>
        )}
      </div>
    </CvPageFrame>
  );
}
