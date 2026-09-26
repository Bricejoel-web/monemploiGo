import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, IconChip, skillTagStyle } from "./shared";
import { PhoneIcon, MailIcon, MapPinIcon } from "../icons";
import { cvLabels } from "@/lib/cv/labels";

export function PremCercles({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = { fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, color: theme.accent, marginBottom: 10 };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ position: "relative", height: 172, flexShrink: 0, background: theme.accent, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -55, right: -45, width: 190, height: 190, borderRadius: "50%", background: "#fff", opacity: 0.22 }} />
          <div style={{ position: "absolute", bottom: -70, right: 40, width: 110, height: 110, borderRadius: "50%", background: "#fff", opacity: 0.12 }} />
          <div style={{ position: "relative", height: "100%", padding: "0 34px", display: "flex", alignItems: "center", gap: 18 }}>
            {includePhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={96 * (data.photoScale ?? 1)} ringColor="#fff" ringWidth={4} bg="#dfe9f3" iconColor={theme.accent} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{data.fullName || t.namePlaceholder}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.85)", marginTop: 5, fontWeight: 500 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            </div>
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 172 - 18} deps={[data]} style={{ padding: "0 34px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 18 }}>
            {data.phone && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5 }}><IconChip bg={theme.accent}><PhoneIcon size={13} /></IconChip>{data.phone}</div>}
            {data.email && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5 }}><IconChip bg={theme.accent}><MailIcon size={13} /></IconChip>{data.email}</div>}
            {data.address && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5 }}><IconChip bg={theme.accent}><MapPinIcon size={13} /></IconChip>{data.address}</div>}
          </div>

          {data.summary && (
            <div>
              <div style={headStyle}>{t.profile.toUpperCase()}</div>
              <p style={{ fontSize: 12, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{t.experience.toUpperCase()}</div>
              <div style={{ position: "relative", paddingLeft: 18, borderLeft: `2px solid ${theme.accentSoft}` }}>
                {data.experience.map((exp, i) => (
                  <div key={i} style={{ position: "relative", paddingBottom: i === data.experience.length - 1 ? 0 : 16 }}>
                    <span style={{ position: "absolute", left: -23, top: 2, width: 10, height: 10, borderRadius: "50%", background: theme.accent, border: "2px solid #fff" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</span>
                      {(exp.start || exp.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{exp.start}–{exp.end}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.accent }}>{exp.company}</div>
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: "#4a453f", margin: "2px 0 0" }}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>{t.education.toUpperCase()}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</span>
                  {(ed.start || ed.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{ed.start}–{ed.end}</span>}
                </div>
                <div style={{ fontSize: 11, color: theme.accent }}>{ed.school}</div>
              </div>
            ))}
          </div>
          )}

          {data.skills.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {data.skills.map((skill) => (
              <span key={skill} style={skillTagStyle(theme.accent, theme.accentSoft)}>{skill}</span>
            ))}
          </div>
          )}

          {data.languages.length > 0 && (
          <div style={{ fontSize: 11.5, color: "#4a453f", paddingBottom: 26 }}>
            {data.languages.map((l) => `${l.name} — ${l.level}`).join(" · ")}
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
