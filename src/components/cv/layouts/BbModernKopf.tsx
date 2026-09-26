import type { BewerbungsbriefLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";

// Variante "en-tête moderne" : un bandeau personnel (nom en grand + ligne de
// contact fine) façon personal branding, tendance vue sur les Anschreiben
// modernes — puis le corps reste au format DIN 5008 classique en dessous.
export function BbModernKopf({ data, theme }: BewerbungsbriefLayoutProps) {
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
          padding: "0 44px 30px 44px",
        }}
      >
        <div style={{ borderBottom: `2px solid ${theme.accent}`, padding: "30px 0 14px 0", marginBottom: 22 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{data.fullName || "Ihr Name"}</div>
          <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 4 }}>
            {[data.address, data.phone, data.email].filter(Boolean).join("  ·  ")}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            {data.recipientInstitution && <div style={{ fontWeight: 600 }}>{data.recipientInstitution}</div>}
            {data.recipientContactName && <div>{data.recipientContactName}</div>}
            {data.recipientAddress && <div>{data.recipientAddress}</div>}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
            {[data.city, data.date].filter(Boolean).join(", den ")}
          </div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 18 }}>{subject}</div>

        <div style={{ fontSize: 11.5, marginBottom: 12 }}>Sehr geehrte Damen und Herren,</div>

        <AdaptiveZone targetHeight={679 - 430} deps={[data]}>
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
            <div style={{ fontWeight: 600, marginBottom: 4, color: theme.accent }}>Anlagen</div>
            <div style={{ color: theme.textMuted }}>{data.attachments.join(", ")}</div>
          </div>
        )}
      </div>
    </CvPageFrame>
  );
}
