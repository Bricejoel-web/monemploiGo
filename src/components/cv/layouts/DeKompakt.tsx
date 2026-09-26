import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";

// Variante "compacte" du CV Allemagne : dates alignées à gauche dans une
// colonne étroite, plus dense que DeTabellarisch.tsx et DeBlockschema.tsx.
// Catégorie ATS : noir sur blanc, sans couleur d'accent.
export function DeKompakt({ data, theme, includePhoto }: CvLayoutProps) {
  const headStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: theme.accent,
    borderBottom: `1px solid ${theme.textMuted}`,
    paddingBottom: 3,
    marginBottom: 8,
  };

  const personalRows: [string, string][] = [
    ...(data.birthDate ? ([["Geburtsdatum", data.birthDate]] as [string, string][]) : []),
    ...(data.birthPlace ? ([["Geburtsort", data.birthPlace]] as [string, string][]) : []),
    ...(data.nationality ? ([["Staatsangehörigkeit", data.nationality]] as [string, string][]) : []),
  ];

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
          padding: "34px 40px 22px 40px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{data.fullName || "Ihr Name"}</div>
            <div style={{ fontSize: 11.5, color: theme.accent, marginTop: 3 }}>
              {data.jobTitle || "Bewerbung um einen Ausbildungsplatz"}
            </div>
            <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
              {[data.address, data.phone, data.email].filter(Boolean).join("  •  ")}
            </div>
          </div>
          {includePhoto && (
            <div style={{ flexShrink: 0 }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={68 * (data.photoScale ?? 1)} ringColor="#c9c6c0" ringWidth={1.5} bg="#f4f3f1" iconColor="#9a958e" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={headStyle}>Persönliche Daten</div>
          {personalRows.length > 0 && (
            <p style={{ fontSize: 10.5, color: theme.textMuted, margin: 0 }}>
              {personalRows.map(([label, value]) => `${label}: ${value}`).join("   •   ")}
            </p>
          )}
        </div>

        <AdaptiveZone targetHeight={679 - 170} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>Profil</div>
              <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>Berufserfahrung</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: i === data.experience.length - 1 ? 0 : 9 }}>
                  {(exp.start || exp.end) && (
                    <div style={{ width: 72, flexShrink: 0, fontSize: 10.5, color: theme.textMuted, paddingTop: 1 }}>
                      {exp.start} – {exp.end}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>
                      {exp.role}
                      {exp.company ? ` — ${exp.company}` : ""}
                    </div>
                    {exp.description && <p style={{ fontSize: 11, lineHeight: 1.5, margin: "2px 0 0" }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>Ausbildung</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i === data.education.length - 1 ? 0 : 6 }}>
                {(ed.start || ed.end) && (
                  <div style={{ width: 72, flexShrink: 0, fontSize: 10.5, color: theme.textMuted, paddingTop: 1 }}>
                    {ed.start} – {ed.end}
                  </div>
                )}
                <div style={{ flex: 1, fontSize: 11.5, fontWeight: 600 }}>
                  {ed.degree}
                  {ed.school ? ` — ${ed.school}` : ""}
                </div>
              </div>
            ))}
          </div>
          )}

          {(data.languages.length > 0 || data.skills.length > 0) && (
          <div>
            <div style={headStyle}>Kenntnisse &amp; Sprachen</div>
            {data.languages.length > 0 && (
              <p style={{ fontSize: 11, margin: 0 }}>{data.languages.map((l) => `${l.name} (${l.level})`).join(", ")}</p>
            )}
            {data.skills.length > 0 && <p style={{ fontSize: 11, margin: "3px 0 0" }}>EDV: {data.skills.join(", ")}</p>}
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
