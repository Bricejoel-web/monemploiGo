import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, skillTagStyle } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

export function StdBandeau({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: theme.accent, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 };
  const dot = <span style={{ width: 7, height: 7, background: theme.accent, display: "inline-block" }} />;

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Work Sans', sans-serif", color: "#26221f" }}>
        <div style={{ background: theme.accent, padding: "26px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {includePhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={64 * (data.photoScale ?? 1)} ringColor="rgba(255,255,255,.8)" ringWidth={2} bg="rgba(255,255,255,.25)" iconColor="#fff" />}
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 25, fontWeight: 700, color: "#fff" }}>{data.fullName || t.namePlaceholder}</h1>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.85)", marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10.5, color: "rgba(255,255,255,.85)", lineHeight: 1.7 }}>
            {data.email}<br />{data.phone}<br />{data.address}
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 78 - 32} deps={[data]} style={{ padding: "28px 40px 0 40px", display: "flex", flexDirection: "column", gap: 21 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>{dot}{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{dot}{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</span>
                    {(exp.start || exp.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{exp.start} – {exp.end}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.accent, margin: "1px 0 4px" }}>{exp.company}</div>
                  {exp.description && <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>{dot}{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</span>
                  {(ed.start || ed.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{ed.start} – {ed.end}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: theme.accent }}>{ed.school}</div>
              </div>
            ))}
          </div>
          )}
          <div style={{ display: "flex", gap: 40 }}>
            {data.skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={headStyle}>{dot}{t.skills}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {data.skills.map((skill) => (
                  <span key={skill} style={{ ...skillTagStyle(theme.accent, theme.accentSoft), background: theme.accentSoft, border: "none", borderRadius: 3 }}>{skill}</span>
                ))}
              </div>
            </div>
            )}
            {data.languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={headStyle}>{dot}{t.languages}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.languages.map((lang) => (
                  <span key={lang.name} style={{ fontSize: 11.5 }}>{lang.name} <span style={{ color: "#8a8580" }}>— {lang.level}</span></span>
                ))}
              </div>
            </div>
            )}
          </div>
        </AdaptiveZone>

        <div style={{ background: theme.accent, height: 8, marginTop: 24, flexShrink: 0 }} />
      </div>
    </CvPageFrame>
  );
}
