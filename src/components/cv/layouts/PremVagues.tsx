import type { CvLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

const BLOB = "63% 37% 54% 46% / 43% 51% 49% 57%";

function Pill({ children, dark = "#1f3b2f" }: { children: React.ReactNode; dark?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".03em",
        textTransform: "uppercase",
        padding: "6px 16px",
        borderRadius: 999,
        background: "#f4efe4",
        color: dark,
        marginBottom: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      }}
    >
      {children}
    </span>
  );
}

export function PremVagues({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fdfcf9", display: "flex", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ width: "36%", padding: "0 20px 24px 26px", position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
          {includePhoto && (
            <div style={{ position: "relative", width: 168, height: 168, marginTop: 22, marginLeft: -6 }}>
              <div style={{ position: "absolute", inset: 0, background: theme.accent, borderRadius: BLOB }} />
              <div style={{ position: "absolute", inset: 10, borderRadius: BLOB, overflow: "hidden", background: "#e5e0d3" }}>
                {data.photoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- photo utilisateur / démonstration
                  <img src={data.photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: includePhoto ? 8 : 30 }}>
            <Pill dark={theme.accent}>Contact</Pill>
            <div style={{ fontSize: 10.5, lineHeight: 2, color: "#4a453f" }}>
              {data.phone && <div>{data.phone}</div>}
              {data.email && <div>{data.email}</div>}
              {data.address && <div>{data.address}</div>}
            </div>
          </div>

          {data.languages.length > 0 && (
          <div>
            <Pill dark={theme.accent}>{t.languages}</Pill>
            <div style={{ fontSize: 10.5, lineHeight: 1.9, color: "#4a453f" }}>
              {data.languages.map((l) => (
                <div key={l.name}>{l.name}{l.level ? ` (${l.level})` : ""}</div>
              ))}
            </div>
          </div>
          )}

          {data.extras && data.extras.length > 0 && (
            <div>
              <Pill dark={theme.accent}>{data.extras[0].title}</Pill>
              <div style={{ fontSize: 10.5, lineHeight: 1.9, color: "#4a453f" }}>{data.extras[0].content}</div>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -40,
              width: 140,
              height: 140,
              background: theme.accent,
              opacity: 0.9,
              borderRadius: BLOB,
            }}
          />
        </div>

        <AdaptiveZone targetHeight={679 - 76} deps={[data]} style={{ width: `${0.64 * 480}px`, padding: "44px 30px 30px 10px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 32, fontWeight: 600, lineHeight: 1.08, color: theme.accent }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4a453f", marginTop: 6 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          </div>

          {data.summary && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8, color: theme.accent }}>{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "#4a453f", margin: 0, fontStyle: "italic" }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10, color: theme.accent }}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                    {exp.company}
                    {exp.location && <span style={{ fontWeight: 400, color: "#8a8580" }}> — {exp.location}</span>}
                  </div>
                  {(exp.start || exp.end) && <div style={{ fontSize: 11, color: "#8a8580" }}>{exp.start} – {exp.end}</div>}
                  <div style={{ fontSize: 11.5, fontStyle: "italic", marginTop: 2 }}>{exp.role}</div>
                  {exp.description && (
                    <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, fontSize: 11, lineHeight: 1.5, color: "#4a453f" }}>
                      <li>{exp.description}</li>
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10, color: theme.accent }}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                  {ed.school}
                  {(ed.start || ed.end) && <span style={{ fontWeight: 400, color: "#8a8580" }}> — {ed.start}-{ed.end}</span>}
                </div>
                <div style={{ fontSize: 11.5, fontStyle: "italic" }}>{ed.degree}</div>
              </div>
            ))}
          </div>
          )}

          {data.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8, color: theme.accent }}>{t.skills}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: 11.5, fontStyle: "italic", color: "#4a453f" }}>
              {data.skills.map((skill) => (
                <div key={skill}>{skill}</div>
              ))}
            </div>
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
