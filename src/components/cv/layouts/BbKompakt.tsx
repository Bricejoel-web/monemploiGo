import type { BewerbungsbriefLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";

// Variante "compacte" : interlignage et marges resserrés (pour les lettres
// plus longues), Betreff en majuscules espacées au lieu du gras souligné.
export function BbKompakt({ data, theme }: BewerbungsbriefLayoutProps) {
  const subject = [
    `Bewerbung um einen Ausbildungsplatz als ${data.targetProgram || "..."}`,
    data.referenceNumber ? `(Ref: ${data.referenceNumber})` : "",
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
          padding: "30px 40px 24px 40px",
        }}
      >
        <div style={{ fontSize: 10, color: theme.textMuted, lineHeight: 1.4, marginBottom: 18 }}>
          {data.fullName || "Ihr Name"} · {[data.address, data.phone, data.email].filter(Boolean).join(" · ")}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, lineHeight: 1.4 }}>
            {data.recipientInstitution && <div style={{ fontWeight: 600 }}>{data.recipientInstitution}</div>}
            {data.recipientContactName && <div>{data.recipientContactName}</div>}
            {data.recipientAddress && <div>{data.recipientAddress}</div>}
          </div>
          <div style={{ fontSize: 10.5, color: theme.textMuted, textAlign: "right", flexShrink: 0 }}>
            {[data.city, data.date].filter(Boolean).join(", den ")}
          </div>
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: theme.accent,
            marginBottom: 14,
          }}
        >
          {subject}
        </div>

        <div style={{ fontSize: 11, marginBottom: 9 }}>Sehr geehrte Damen und Herren,</div>

        <AdaptiveZone targetHeight={679 - 330} deps={[data]}>
          <p style={{ fontSize: 11, lineHeight: 1.55, whiteSpace: "pre-wrap", margin: 0 }}>{data.body}</p>
        </AdaptiveZone>

        <div style={{ marginTop: 18, fontSize: 11, flexShrink: 0 }}>
          Mit freundlichen Grüßen
          <br />
          {data.fullName}
        </div>

        {data.attachments.length > 0 && (
          <div style={{ marginTop: 14, fontSize: 10, flexShrink: 0 }}>
            <span style={{ fontWeight: 600 }}>Anlagen: </span>
            <span style={{ color: theme.textMuted }}>{data.attachments.join(", ")}</span>
          </div>
        )}
      </div>
    </CvPageFrame>
  );
}
