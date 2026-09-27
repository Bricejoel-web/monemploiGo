import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

export function PremDiagonale({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const pill = (label: string) => (
    <span
      style={{
        display: "inline-block",
        background: theme.accent,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        padding: "4px 11px",
        borderRadius: 999,
        marginBottom: 9,
      }}
    >
      {label}
    </span>
  );

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ position: "relative", height: 118, flexShrink: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: theme.accent, clipPath: "polygon(0 0, 100% 0, 100% 68%, 0 100%)" }} />
          <div style={{ position: "relative", height: "100%", padding: "0 30px", display: "flex", alignItems: "center", gap: 16 }}>
            {includePhoto && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 4, boxShadow: "0 5px 14px rgba(0,0,0,.18)" }}>
                <PhotoCircle photoDataUrl={data.photoDataUrl} size={72 * (data.photoScale ?? 1)} ringColor="#fff" ringWidth={0} bg="#efece6" iconColor={theme.accent} />
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 19, fontWeight: 700, color: "#fff" }}>{data.fullName || t.namePlaceholder}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.9)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 2 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            </div>
          </div>
        </div>

        <AdaptiveZone targetHeight={679 - 118} deps={[data]} style={{ padding: "26px 30px 30px 30px", display: "flex", gap: 22 }}>
          <div style={{ width: 130, flexShrink: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {(data.phone || data.email || data.address) && (
              <div>
                {pill(locale === "en" ? "Contact" : "Contact")}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.phone && <div>{data.phone}</div>}
                  {data.email && <div>{data.email}</div>}
                  {data.address && <div>{data.address}</div>}
                </div>
              </div>
            )}
            {data.skills.length > 0 && (
              <div>
                {pill(t.skills)}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.skills.map((skill) => (
                    <div key={skill}>{skill}</div>
                  ))}
                </div>
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                {pill(t.languages)}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10, color: "#4a453f" }}>
                  {data.languages.map((l) => (
                    <div key={l.name}>{l.name} — {l.level}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {data.summary && (
              <div>
                {pill(t.profile)}
                <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
              </div>
            )}

            {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
              <div>
                {pill(t.experience)}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {data.experience.map((exp, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: theme.accent, flexShrink: 0 }} />
                        {i !== data.experience.length - 1 && <span style={{ width: 2, flexGrow: 1, background: theme.accentSoft, marginTop: 2 }} />}
                      </div>
                      <div style={{ paddingBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                        {(exp.start || exp.end) && <div style={{ fontSize: 10.5, color: theme.accent, fontWeight: 700 }}>{exp.start} — {exp.end}</div>}
                        <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 1 }}>{exp.role}{exp.company ? ` — ${exp.company}` : ""}</div>
                        {exp.description && <p style={{ fontSize: 11, color: "#4a453f", margin: "2px 0 0", lineHeight: 1.45 }}>{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
              <div>
                {pill(t.education)}
                {data.education.map((ed, i) => (
                  <div key={i} style={{ fontSize: 11.5, marginBottom: i === data.education.length - 1 ? 0 : 6 }}>
                    <span style={{ fontWeight: 700 }}>{ed.degree}</span>
                    {ed.school && <span> — {ed.school}</span>}
                    {(ed.start || ed.end) && <span style={{ color: "#8a8580" }}> · {ed.start}–{ed.end}</span>}
                  </div>
                ))}
              </div>
            )}

            {data.extras && data.extras.length > 0 && (
              <div>
                {pill(data.extras[0].title)}
                <div style={{ fontSize: 11, lineHeight: 1.5, color: "#4a453f", whiteSpace: "pre-line" }}>{data.extras[0].content}</div>
              </div>
            )}
          </div>
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
