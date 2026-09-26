import type { BewerbungsbriefLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";

// Bewerbungsbrief au format DIN 5008 strict : bloc expéditeur compact en
// haut à gauche, bloc destinataire, date alignée à droite, Betreff gras
// souligné, Anlagen en liste séparée par virgules — la disposition la plus
// classique et sûre (voir docs/ROADMAP.md, recherche DIN 5008).
export function BbDinKlassisch({ data, theme }: BewerbungsbriefLayoutProps) {
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
        <div style={{ fontSize: 10.5, color: theme.textMuted, lineHeight: 1.5, marginBottom: 26 }}>
          {data.fullName || "Ihr Name"}
          <br />
          {data.address}
          <br />
          {[data.phone, data.email].filter(Boolean).join(" · ")}
        </div>

        <div style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 18 }}>
          {data.recipientInstitution && <div style={{ fontWeight: 600 }}>{data.recipientInstitution}</div>}
          {data.recipientContactName && <div>{data.recipientContactName}</div>}
          {data.recipientAddress && <div>{data.recipientAddress}</div>}
        </div>

        <div style={{ textAlign: "right", fontSize: 11, color: theme.textMuted, marginBottom: 22 }}>
          {[data.city, data.date].filter(Boolean).join(", den ")}
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: theme.accent,
            borderBottom: `1.5px solid ${theme.accent}`,
            paddingBottom: 6,
            marginBottom: 20,
          }}
        >
          {subject}
        </div>

        <div style={{ fontSize: 11.5, marginBottom: 12 }}>Sehr geehrte Damen und Herren,</div>

        <AdaptiveZone targetHeight={679 - 400} deps={[data]}>
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
