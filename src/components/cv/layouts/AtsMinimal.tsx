import type { CvLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

// Variante "minimaliste" de la catégorie ATS : encore plus proche d'un
// document texte brut que AtsExecutif.tsx (aucun filet, aucune bordure,
// juste des titres de section en petites capitales espacées) — toujours en
// une seule colonne, noir sur blanc, sans icône ni photo.
export function AtsMinimal({ data, theme, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: theme.accent,
    marginBottom: 8,
  };

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
          padding: "40px 46px 28px 46px",
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.01em" }}>{data.fullName || t.namePlaceholder}</div>
          <div style={{ fontSize: 12.5, marginTop: 4, color: theme.accent }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
            {[data.email, data.phone, data.address].filter(Boolean).join("   |   ")}
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 130} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 13 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {exp.role}
                    {exp.company ? `, ${exp.company}` : ""}
                    {exp.location ? ` (${exp.location})` : ""}
                  </div>
                  {(exp.start || exp.end) && (
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                      {exp.start} – {exp.end}
                    </div>
                  )}
                  {exp.description && <p style={{ fontSize: 11.5, lineHeight: 1.55, margin: "4px 0 0" }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {ed.degree}
                  {ed.school ? `, ${ed.school}` : ""}
                </div>
                {(ed.start || ed.end) && (
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                    {ed.start} – {ed.end}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {data.skills.length > 0 && (
          <div>
            <div style={headStyle}>{t.skills}</div>
            <p style={{ fontSize: 11.5, margin: 0 }}>{data.skills.join(", ")}</p>
          </div>
          )}

          {data.languages.length > 0 && (
          <div>
            <div style={headStyle}>{t.languages}</div>
            <p style={{ fontSize: 11.5, margin: 0 }}>{data.languages.map((l) => `${l.name} (${l.level})`).join(", ")}</p>
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
