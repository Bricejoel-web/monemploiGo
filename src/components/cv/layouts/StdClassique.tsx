import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, skillTagStyle } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

export function StdClassique({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Work Sans', sans-serif", color: "#26221f" }}>
        <div style={{ padding: "34px 40px 22px 40px", display: "flex", alignItems: "center", gap: 16 }}>
          {includePhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={80 * (data.photoScale ?? 1)} ringColor="#fff" bg={theme.accentSoft} iconColor={theme.accent} />}
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 29, fontWeight: 700, color: "#231f1c" }}>{data.fullName || t.namePlaceholder}</h1>
            <div style={{ fontSize: 13, fontWeight: 500, color: theme.accent, marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            <div style={{ fontSize: 11, color: "#8a8580", marginTop: 10 }}>{[data.email, data.phone, data.address].filter(Boolean).join("  ·  ")}</div>
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 129 - 29} deps={[data]} style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 22 }}>
          {data.summary && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${theme.accent}`, display: "inline-block" }}>{t.profile}</div>
              <p style={{ fontSize: 12, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${theme.accent}`, display: "inline-block" }}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</span>
                    {(exp.start || exp.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{exp.start} – {exp.end}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: theme.accent, margin: "1px 0 4px" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  {exp.description && <p style={{ fontSize: 12, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${theme.accent}`, display: "inline-block" }}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</span>
                  {(ed.start || ed.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{ed.start} – {ed.end}</span>}
                </div>
                <div style={{ fontSize: 12, color: theme.accent, margin: "1px 0 4px" }}>{ed.school}{ed.location ? ` · ${ed.location}` : ""}</div>
              </div>
            ))}
          </div>
          )}

          {data.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${theme.accent}`, display: "inline-block" }}>{t.skills}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {data.skills.map((skill) => (
                <span key={skill} style={skillTagStyle(theme.accent, theme.accentSoft)}>{skill}</span>
              ))}
            </div>
          </div>
          )}

          {data.languages.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${theme.accent}`, display: "inline-block" }}>{t.languages}</div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {data.languages.map((lang) => (
                <span key={lang.name} style={{ fontSize: 12 }}>{lang.name} <span style={{ color: "#8a8580" }}>— {lang.level}</span></span>
              ))}
            </div>
          </div>
          )}
        </AdaptiveZone>

        <div style={{ height: 5, background: theme.accent, marginTop: 24, flexShrink: 0 }} />
      </div>
    </CvPageFrame>
  );
}
