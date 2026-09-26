import type { CvLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

// Variante "compacte" de la catégorie ATS : dates placées en premier (une
// convention courante des CV exécutifs anglo-saxons très denses en
// informations), titres de section soulignés fins. Toujours une seule
// colonne, noir sur blanc, sans icône ni photo.
export function AtsCompact({ data, theme, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
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
          padding: "36px 40px 24px 40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 23, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</div>
          <div style={{ fontSize: 12, marginTop: 3, color: theme.accent }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
            {[data.email, data.phone, data.address].filter(Boolean).join("  •  ")}
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 120} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>{t.profile}</div>
              <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: i === data.experience.length - 1 ? 0 : 10 }}>
                  {(exp.start || exp.end) && (
                    <div style={{ width: 74, flexShrink: 0, fontSize: 10.5, color: theme.textMuted, paddingTop: 1 }}>
                      {exp.start} – {exp.end}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {exp.role}
                      {exp.company ? ` — ${exp.company}` : ""}
                      {exp.location ? `, ${exp.location}` : ""}
                    </div>
                    {exp.description && <p style={{ fontSize: 11, lineHeight: 1.5, margin: "2px 0 0" }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i === data.education.length - 1 ? 0 : 6 }}>
                {(ed.start || ed.end) && (
                  <div style={{ width: 74, flexShrink: 0, fontSize: 10.5, color: theme.textMuted, paddingTop: 1 }}>
                    {ed.start} – {ed.end}
                  </div>
                )}
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
                  {ed.degree}
                  {ed.school ? ` — ${ed.school}` : ""}
                </div>
              </div>
            ))}
          </div>
          )}

          {data.skills.length > 0 && (
          <div>
            <div style={headStyle}>{t.skills}</div>
            <p style={{ fontSize: 11, margin: 0 }}>{data.skills.join(", ")}</p>
          </div>
          )}

          {data.languages.length > 0 && (
          <div>
            <div style={headStyle}>{t.languages}</div>
            <p style={{ fontSize: 11, margin: 0 }}>{data.languages.map((l) => `${l.name} (${l.level})`).join(", ")}</p>
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
