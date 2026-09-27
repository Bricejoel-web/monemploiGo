import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, IconChip, levelToPct } from "./shared";
import { PhoneIcon, MailIcon, MapPinIcon } from "../icons";
import { cvLabels } from "@/lib/cv/labels";

function SidebarPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        padding: "6px 18px",
        borderRadius: 999,
        border: "1.5px solid rgba(255,255,255,.6)",
        color: "#fff",
        marginBottom: 12,
      }}
    >
      {children}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.2)", overflow: "hidden", marginTop: 5 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
}

export function PremPilules({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const NAVY = "#152a52";

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ width: "38%", background: NAVY, padding: "36px 24px", display: "flex", flexDirection: "column", gap: 20, color: "#fff" }}>
          {includePhoto && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={108 * (data.photoScale ?? 1)} ringColor="#fff" ringWidth={4} bg="#22407a" iconColor="#fff" />
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 11, fontStyle: "italic", color: theme.accent, marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <SidebarPill>Contact</SidebarPill>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              {data.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5 }}><IconChip bg={theme.accent}><PhoneIcon size={11} /></IconChip>{data.phone}</div>}
              {data.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5 }}><IconChip bg={theme.accent}><MailIcon size={11} /></IconChip>{data.email}</div>}
              {data.address && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5 }}><IconChip bg={theme.accent}><MapPinIcon size={11} /></IconChip>{data.address}</div>}
            </div>
          </div>

          {data.skills.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <SidebarPill>{t.skills}</SidebarPill>
            <div style={{ width: "100%" }}>
              {data.skills.slice(0, 4).map((skill, i) => (
                <div key={skill} style={{ fontSize: 10.5, marginBottom: 8 }}>
                  {skill}
                  <Bar pct={92 - i * 10} color={theme.accent} />
                </div>
              ))}
            </div>
          </div>
          )}

          {data.languages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <SidebarPill>{t.languages}</SidebarPill>
            <div style={{ width: "100%" }}>
              {data.languages.map((l) => (
                <div key={l.name} style={{ fontSize: 10.5, marginBottom: 8 }}>
                  {l.name} <span style={{ opacity: 0.7 }}>— {l.level}</span>
                  <Bar pct={levelToPct(l.level)} color={theme.accent} />
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <AdaptiveZone targetHeight={679 - 76} deps={[data]} style={{ width: `${0.62 * 480}px`, padding: "40px 30px", display: "flex", flexDirection: "column", gap: 20 }}>
          {data.summary && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, borderBottom: `2px solid ${theme.accent}`, paddingBottom: 6, marginBottom: 10, display: "inline-block" }}>{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, borderBottom: `2px solid ${theme.accent}`, paddingBottom: 6, marginBottom: 12, display: "inline-block" }}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ width: 62, flexShrink: 0, fontSize: 10.5, color: theme.accent, fontWeight: 700, paddingTop: 1 }}>{(exp.start || exp.end) && `${exp.start}–${exp.end}`}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{exp.role}</div>
                    <div style={{ fontSize: 11, fontStyle: "italic", color: "#8a8580" }}>{exp.company}</div>
                    {exp.description && <p style={{ fontSize: 11, lineHeight: 1.5, margin: "3px 0 0", color: "#4a453f" }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, borderBottom: `2px solid ${theme.accent}`, paddingBottom: 6, marginBottom: 12, display: "inline-block" }}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ width: 62, flexShrink: 0, fontSize: 10.5, color: theme.accent, fontWeight: 700, paddingTop: 1 }}>{(ed.start || ed.end) && `${ed.start}–${ed.end}`}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{ed.degree}</div>
                  <div style={{ fontSize: 11, fontStyle: "italic", color: "#8a8580" }}>{ed.school}</div>
                </div>
              </div>
            ))}
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
