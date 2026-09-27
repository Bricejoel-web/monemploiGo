import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

export function PremVagueLaterale({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 11.5,
    fontWeight: 700,
    color: theme.accent,
    textTransform: "uppercase",
    letterSpacing: ".04em",
    marginBottom: 8,
  };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", overflow: "hidden", fontFamily: "'Manrope', sans-serif", color: "#20242c" }}>
        <div style={{ width: 168, flexShrink: 0, background: theme.accent, color: "#fff", padding: "28px 20px", position: "relative", display: "flex", flexDirection: "column", gap: 18 }}>
          {includePhoto && (
            <PhotoCircle photoDataUrl={data.photoDataUrl} size={76 * (data.photoScale ?? 1)} ringColor="rgba(255,255,255,.4)" ringWidth={3} bg="rgba(255,255,255,.15)" iconColor="#fff" />
          )}
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 11, letterSpacing: ".04em", marginTop: 5, textTransform: "uppercase" }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          </div>

          {(data.phone || data.email || data.address) && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7, borderBottom: "1px solid rgba(255,255,255,.4)", paddingBottom: 5 }}>
                {locale === "en" ? "Contact" : "Contact"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10.5 }}>
                {data.phone && <div>{data.phone}</div>}
                {data.email && <div>{data.email}</div>}
                {data.address && <div>{data.address}</div>}
              </div>
            </div>
          )}

          {data.languages.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7, borderBottom: "1px solid rgba(255,255,255,.4)", paddingBottom: 5 }}>
                {t.languages}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10.5 }}>
                {data.languages.map((l) => (
                  <div key={l.name}>{l.name} — {l.level}</div>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7, borderBottom: "1px solid rgba(255,255,255,.4)", paddingBottom: 5 }}>
                {t.skills}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10.5 }}>
                {data.skills.map((skill) => (
                  <div key={skill}>{skill}</div>
                ))}
              </div>
            </div>
          )}

          <svg viewBox="0 0 30 679" preserveAspectRatio="none" style={{ position: "absolute", top: 0, right: -29, width: 30, height: "100%" }}>
            <path d="M0,0 C 22,110 -8,205 15,300 C 34,380 -4,445 11,525 C 22,590 4,635 0,679 L 30,679 L 30,0 Z" fill={theme.accent} />
          </svg>
        </div>

        {/* Le conteneur de ligne (sidebar + colonne principale) n'a pas
            `alignItems` défini, donc `stretch` par défaut : sans cet
            enrobage, `AdaptiveZone` serait lui-même étiré à la hauteur de la
            barre latérale, faussant sa propre mesure de hauteur naturelle —
            même défaut déjà rencontré et corrigé une fois sur ce projet
            (mise en page "Deux colonnes sobres"). En isolant `AdaptiveZone`
            dans un bloc non étiré, seule sa propre mesure de contenu compte. */}
        <div style={{ flexGrow: 1, minWidth: 0 }}>
        <AdaptiveZone targetHeight={679 - 56} deps={[data]} style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.experience.map((exp, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{exp.company || exp.role}</span>
                      {(exp.start || exp.end) && <span style={{ fontSize: 10.5, color: "#8a8580" }}>{exp.start} — {exp.end}</span>}
                    </div>
                    {exp.company && exp.role && <div style={{ fontSize: 11, fontStyle: "italic", color: theme.accent, margin: "1px 0 3px" }}>{exp.role}</div>}
                    {exp.description && <p style={{ fontSize: 11, color: "#4a453f", margin: 0, lineHeight: 1.45 }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
            <div>
              <div style={headStyle}>{t.education}</div>
              {data.education.map((ed, i) => (
                <div key={i} style={{ fontSize: 11.5, marginBottom: i === data.education.length - 1 ? 0 : 5 }}>
                  <span style={{ fontWeight: 700 }}>{ed.degree}</span>
                  {ed.school && <span> — {ed.school}</span>}
                  {(ed.start || ed.end) && <span style={{ color: "#8a8580" }}> · {ed.start}–{ed.end}</span>}
                </div>
              ))}
            </div>
          )}

          {data.extras && data.extras.length > 0 && (
            <div>
              <div style={headStyle}>{data.extras[0].title}</div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: "#4a453f", whiteSpace: "pre-line" }}>{data.extras[0].content}</div>
            </div>
          )}
        </AdaptiveZone>
        </div>
      </div>
    </CvPageFrame>
  );
}
