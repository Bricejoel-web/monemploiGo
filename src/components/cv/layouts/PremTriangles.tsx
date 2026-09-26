import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone, IconChip } from "./shared";
import { PhoneIcon, MailIcon } from "../icons";
import { cvLabels } from "@/lib/cv/labels";

const CHARCOAL = "#22252b";

function SkillBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ fontSize: 10.5, marginBottom: 8 }}>
      {label}
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.15)", overflow: "hidden", marginTop: 4 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function PremTriangles({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const badge = (bg: string, textColor: string, label: string) => (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "5px 13px", borderRadius: 4, color: textColor, background: bg, marginBottom: 12 }}>{label}</span>
  );

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ width: "35%", background: CHARCOAL, padding: "34px 22px", display: "flex", flexDirection: "column", gap: 22, color: "#fff", position: "relative", overflow: "hidden" }}>
          <svg width="200" height="180" style={{ position: "absolute", top: -20, left: -30 }} viewBox="0 0 200 180">
            <polygon points="0,0 140,0 40,180" fill={theme.accent} opacity="0.9" />
            <polygon points="0,0 90,0 0,120" fill={theme.accent} opacity="0.5" />
          </svg>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, marginTop: 30 }}>
            {includePhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={90 * (data.photoScale ?? 1)} ringColor={theme.accent} ringWidth={3} bg="#33363d" iconColor="#fff" />}
            <div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</div>
              {badge(theme.accent, "#fff", data.jobTitle || t.jobTitlePlaceholder)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.email && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#d8d6d0" }}><IconChip bg={theme.accent}><MailIcon size={12} /></IconChip>{data.email}</div>}
            {data.phone && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#d8d6d0" }}><IconChip bg={theme.accent}><PhoneIcon size={12} /></IconChip>{data.phone}</div>}
          </div>
          {data.skills.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, opacity: 0.95 }}>{t.skills}</div>
            {data.skills.slice(0, 4).map((skill, i) => (
              <SkillBar key={skill} label={skill} pct={90 - i * 8} color={theme.accent} />
            ))}
          </div>
          )}
          {data.languages.length > 0 && (
          <div style={{ marginTop: "auto" }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: theme.accent, marginBottom: 10, opacity: 0.95 }}>{t.languages}</div>
            {data.languages.map((l) => (
              <div key={l.name} style={{ fontSize: 10.5, marginBottom: 6, color: "#d8d6d0" }}>
                {l.name} <span style={{ opacity: 0.7 }}>— {l.level}</span>
              </div>
            ))}
          </div>
          )}
        </div>

        <AdaptiveZone targetHeight={679 - 72} deps={[data]} style={{ width: `${0.65 * 480}px`, padding: "36px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
          {data.summary && (
            <div>
              {badge(theme.accentSoft, theme.accent, t.profile)}
              <p style={{ fontSize: 12, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              {badge(theme.accent, "#fff", t.experience)}
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</span>
                    {(exp.start || exp.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{exp.start}–{exp.end}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.accent, margin: "1px 0 4px" }}>{exp.company}</div>
                  <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "#4a453f", margin: 0 }}>{exp.description}</p>
                </div>
              ))}
            </div>
          )}
          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            {badge(theme.accentSoft, theme.accent, t.education)}
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</span>
                  {(ed.start || ed.end) && <span style={{ fontSize: 11, color: "#8a8580" }}>{ed.start}–{ed.end}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: theme.accent }}>{ed.school}</div>
              </div>
            ))}
          </div>
          )}
          {data.extras && data.extras.length > 0 && (
            <div style={{ marginTop: "auto" }}>
              {badge(CHARCOAL, "#fff", data.extras[0].title)}
              <p style={{ fontSize: 12, margin: 0, color: "#4a453f" }}>{data.extras[0].content}</p>
            </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
