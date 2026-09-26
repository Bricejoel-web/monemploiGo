import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";

// Variante "Blocklebenslauf" (par blocs) du CV Allemagne : à la différence
// de DeTabellarisch.tsx (colonnes date/libellé façon tableau), les
// informations sont présentées en paragraphes continus, une convention
// allemande également répandue. Catégorie ATS : noir sur blanc, une seule
// colonne, sans couleur d'accent.
export function DeBlockschema({ data, theme, includePhoto }: CvLayoutProps) {
  const headStyle: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: theme.accent,
    marginBottom: 8,
  };

  const personalLine = [
    data.birthDate && `geb. ${data.birthDate}`,
    data.birthPlace && `in ${data.birthPlace}`,
    data.nationality,
    data.address,
    data.phone,
    data.email,
  ]
    .filter(Boolean)
    .join(" · ");

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
          padding: "38px 44px 24px 44px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>Lebenslauf — {data.fullName || "Ihr Name"}</div>
            <div style={{ fontSize: 12, color: theme.accent, marginTop: 3 }}>
              {data.jobTitle || "Bewerbung um einen Ausbildungsplatz"}
            </div>
          </div>
          {includePhoto && (
            <div style={{ flexShrink: 0 }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={72 * (data.photoScale ?? 1)} ringColor="#c9c6c0" ringWidth={1.5} bg="#f4f3f1" iconColor="#9a958e" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={headStyle}>Persönliche Daten</div>
          {personalLine && <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{personalLine}</p>}
        </div>

        <AdaptiveZone targetHeight={679 - 200} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>Profil</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>Berufserfahrung</div>
              {data.experience.map((exp, i) => (
                <p key={i} style={{ fontSize: 11.5, lineHeight: 1.6, margin: i === 0 ? 0 : "8px 0 0" }}>
                  {(exp.start || exp.end) && <strong>{exp.start} – {exp.end}: </strong>}
                  {exp.role}
                  {exp.company ? ` bei ${exp.company}` : ""}
                  {exp.location ? `, ${exp.location}` : ""}
                  {exp.description ? `. ${exp.description}` : ""}
                </p>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>Ausbildung</div>
            {data.education.map((ed, i) => (
              <p key={i} style={{ fontSize: 11.5, lineHeight: 1.6, margin: i === 0 ? 0 : "6px 0 0" }}>
                {(ed.start || ed.end) && <strong>{ed.start} – {ed.end}: </strong>}
                {ed.degree}
                {ed.school ? ` — ${ed.school}` : ""}
              </p>
            ))}
          </div>
          )}

          {(data.languages.length > 0 || data.skills.length > 0) && (
          <div>
            <div style={headStyle}>Kenntnisse &amp; Sprachen</div>
            {data.languages.length > 0 && (
              <p style={{ fontSize: 11.5, margin: 0 }}>
                {data.languages.map((l) => `${l.name} (${l.level})`).join(", ")}
              </p>
            )}
            {data.skills.length > 0 && (
              <p style={{ fontSize: 11.5, margin: "4px 0 0" }}>EDV: {data.skills.join(", ")}</p>
            )}
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
