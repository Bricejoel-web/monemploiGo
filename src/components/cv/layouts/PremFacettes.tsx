import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, IconChip } from "./shared";
import { PhoneIcon, MailIcon, MapPinIcon } from "../icons";
import { cvLabels } from "@/lib/cv/labels";

export function PremFacettes({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    color: theme.accent,
    marginBottom: 9,
  };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ position: "relative", padding: "30px 32px 0 32px", display: "flex", alignItems: "flex-start", gap: 16, overflow: "hidden" }}>
          <svg width="220" height="130" style={{ position: "absolute", top: 0, right: 0 }} viewBox="0 0 220 130" preserveAspectRatio="none">
            <polygon points="70,0 220,0 220,130 150,130" fill={theme.accent} />
            <polygon points="120,0 165,0 100,130 55,130" fill="#8a8580" opacity="0.35" />
          </svg>
          {includePhoto && (
            <div style={{ position: "relative" }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={82 * (data.photoScale ?? 1)} ringColor={theme.accent} ringWidth={4} bg="#efece6" iconColor={theme.accent} />
            </div>
          )}
          <div style={{ position: "relative", paddingTop: 8 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.accent, textTransform: "uppercase", letterSpacing: ".05em", marginTop: 4 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            <div style={{ width: 34, height: 2.5, background: theme.accent, marginTop: 8 }} />
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 108} deps={[data]} style={{ padding: "20px 32px 30px 32px", display: "flex", gap: 24 }}>
          <div style={{ width: 138, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            {(data.phone || data.email || data.address) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={headStyle}>{locale === "en" ? "Contact" : "Contact"}</div>
                {data.phone && <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10 }}><IconChip bg={theme.accentSoft}><PhoneIcon size={11} color={theme.accent} /></IconChip>{data.phone}</div>}
                {data.email && <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10 }}><IconChip bg={theme.accentSoft}><MailIcon size={11} color={theme.accent} /></IconChip>{data.email}</div>}
                {data.address && <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10 }}><IconChip bg={theme.accentSoft}><MapPinIcon size={11} color={theme.accent} /></IconChip>{data.address}</div>}
              </div>
            )}
            {data.skills.length > 0 && (
              <div>
                <div style={headStyle}>{t.skills}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.skills.map((skill) => (
                    <span key={skill} style={{ fontSize: 10.5, color: "#4a453f" }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                <div style={headStyle}>{t.languages}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.languages.map((l) => (
                    <span key={l.name} style={{ fontSize: 10.5, color: "#4a453f" }}>{l.name} — {l.level}</span>
                  ))}
                </div>
              </div>
            )}
            {data.extras && data.extras.length > 0 && (
              <div>
                <div style={headStyle}>{data.extras[0].title}</div>
                <div style={{ fontSize: 10, lineHeight: 1.5, color: "#4a453f", whiteSpace: "pre-line" }}>{data.extras[0].content}</div>
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {data.summary && (
              <div>
                <div style={headStyle}>{t.profile}</div>
                <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
              </div>
            )}

            {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
              <div>
                <div style={headStyle}>{t.experience}</div>
                <div style={{ position: "relative", paddingLeft: 16, borderLeft: `2px solid ${theme.accentSoft}` }}>
                  {data.experience.map((exp, i) => (
                    <div key={i} style={{ position: "relative", paddingBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                      <span style={{ position: "absolute", left: -21, top: 2, width: 9, height: 9, borderRadius: "50%", background: theme.accent, border: "2px solid #fff" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{exp.role}</span>
                        {(exp.start || exp.end) && <span style={{ fontSize: 10.5, color: "#8a8580" }}>{exp.start}–{exp.end}</span>}
                      </div>
                      <div style={{ fontSize: 11, fontStyle: "italic", color: theme.accent, margin: "1px 0 3px" }}>{exp.company}</div>
                      {exp.description && <p style={{ fontSize: 11, lineHeight: 1.5, color: "#4a453f", margin: 0 }}>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
              <div>
                <div style={headStyle}>{t.education}</div>
                {data.education.map((ed, i) => (
                  <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{ed.degree}</span>
                      {(ed.start || ed.end) && <span style={{ fontSize: 10.5, color: "#8a8580" }}>{ed.start}–{ed.end}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.accent }}>{ed.school}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
