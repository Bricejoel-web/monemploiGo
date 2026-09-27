import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

const BANNER_LABEL: Record<string, string> = { fr: "Candidature", en: "Application" };

export function PremBanniere({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: theme.accent,
    textTransform: "uppercase",
    letterSpacing: ".04em",
    marginBottom: 5,
  };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ background: theme.accent, color: "#fff", padding: "10px 32px", textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", flexShrink: 0 }}>
          {BANNER_LABEL[locale] ?? BANNER_LABEL.fr}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 32px 12px 32px", borderBottom: `3px solid ${theme.accent}`, flexShrink: 0 }}>
          {includePhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={78 * (data.photoScale ?? 1)} ringColor={theme.accent} ringWidth={3} bg="#efece6" iconColor={theme.accent} />}
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 21, fontWeight: 700, lineHeight: 1.15 }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.accent, marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 100} deps={[data]} style={{ display: "flex" }}>
          <div style={{ width: 150, flexShrink: 0, background: "#faf9f7", padding: "14px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
            {(data.phone || data.email || data.address) && (
              <div>
                <div style={{ ...headStyle, color: "#20242c" }}>{locale === "en" ? "Contact" : "Contact"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.phone && <div>{data.phone}</div>}
                  {data.email && <div>{data.email}</div>}
                  {data.address && <div>{data.address}</div>}
                </div>
              </div>
            )}
            {data.skills.length > 0 && (
              <div>
                <div style={{ ...headStyle, color: "#20242c" }}>{t.skills}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.skills.map((skill) => (
                    <div key={skill}>{skill}</div>
                  ))}
                </div>
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                <div style={{ ...headStyle, color: "#20242c" }}>{t.languages}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.languages.map((l) => (
                    <div key={l.name}>{l.name} — {l.level}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1, minWidth: 0, padding: "14px 26px", display: "flex", flexDirection: "column", gap: 11 }}>
            {data.summary && (
              <div>
                <div style={headStyle}>{t.profile}</div>
                <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
              </div>
            )}

            {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
              <div>
                <div style={headStyle}>{t.education}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.education.map((ed, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{ed.degree}</span>
                        {(ed.start || ed.end) && <span style={{ fontSize: 10.5, color: "#8a8580" }}>{ed.start}–{ed.end}</span>}
                      </div>
                      {ed.school && <div style={{ fontSize: 11, color: "#4a453f" }}>{ed.school}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
              <div>
                <div style={headStyle}>{t.experience}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.experience.map((exp, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{exp.role}{exp.company ? ` — ${exp.company}` : ""}</div>
                      {exp.description && <p style={{ fontSize: 11, color: "#4a453f", margin: "2px 0 0", lineHeight: 1.45 }}>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.extras && data.extras.length > 0 && (
              <div>
                <div style={headStyle}>{data.extras[0].title}</div>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: "#4a453f", whiteSpace: "pre-line" }}>{data.extras[0].content}</div>
              </div>
            )}
          </div>
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
