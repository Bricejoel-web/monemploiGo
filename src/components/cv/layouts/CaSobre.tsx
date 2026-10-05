import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle } from "./shared";
import {
  achievementLines,
  byRecency,
  canadaCvLabels,
  certificationDetail,
  certificationsOf,
  contactItems,
  dateRange,
  hasEducation,
  hasExperience,
  languageLine,
} from "@/lib/cv/canada-labels";

// CV Canadien, modèle 1 : en-tête pleine largeur, puis une colonne
// principale (résumé, expérience, formation, certifications) et une
// colonne étroite séparée par un simple filet (compétences, langues).
// Photo facultative, jamais imposée ; aucune donnée personnelle superflue.
// La page n'est jamais agrandie artificiellement : le CV fait une ou deux
// pages selon son contenu.
export function CaSobre({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = canadaCvLabels[locale];
  const certifications = certificationsOf(data);
  const head: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: theme.accent,
    marginBottom: 7,
  };
  const entry: React.CSSProperties = { breakInside: "avoid" };
  const titleRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, fontWeight: 600 };
  const dates: React.CSSProperties = { fontSize: 10, fontWeight: 400, color: theme.textMuted, whiteSpace: "nowrap" };
  const sub: React.CSSProperties = { fontSize: 10.5, color: theme.textMuted };

  return (
    <CvPageFrame>
      <div
        style={{
          width: 480,
          minHeight: 679,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'IBM Plex Sans', sans-serif",
          color: theme.text,
          padding: "34px 34px 26px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 14, borderBottom: `2px solid ${theme.accent}` }}>
          {includePhoto && data.photoDataUrl && <PhotoCircle photoDataUrl={data.photoDataUrl} size={64} ringWidth={0} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: theme.accent }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 6, overflowWrap: "anywhere" }}>{contactItems(data).join("  ·  ")}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 15 }}>
            {data.summary.trim() && (
              <div>
                <div style={head}>{t.summary}</div>
                <p style={{ fontSize: 11, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
              </div>
            )}

            {hasExperience(data) && (
              <div>
                <div style={head}>{t.experience}</div>
                {byRecency(data.experience).map((exp, i) => (
                  <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 12 }}>
                    <div style={titleRow}>
                      <span>{exp.role}</span>
                      <span style={dates}>{dateRange(exp.start, exp.end, locale)}</span>
                    </div>
                    <div style={sub}>{[exp.company, exp.location].filter(Boolean).join(" — ")}</div>
                    {exp.description && (
                      <ul style={{ listStyleType: "disc", margin: "4px 0 0", paddingLeft: 14, fontSize: 10.5, lineHeight: 1.5 }}>
                        {achievementLines(exp.description).map((line, j) => (
                          <li key={j}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasEducation(data) && (
              <div>
                <div style={head}>{t.education}</div>
                {byRecency(data.education).map((ed, i) => (
                  <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 8 }}>
                    <div style={titleRow}>
                      <span>{ed.degree}</span>
                      <span style={dates}>{dateRange(ed.start, ed.end, locale)}</span>
                    </div>
                    <div style={sub}>{[ed.school, ed.location].filter(Boolean).join(" — ")}</div>
                  </div>
                ))}
              </div>
            )}

            {certifications.length > 0 && (
              <div>
                <div style={head}>{t.certifications}</div>
                {certifications.map((c, i) => (
                  <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</div>
                    {certificationDetail(c) && <div style={sub}>{certificationDetail(c)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(data.skills.length > 0 || data.languages.length > 0) && (
            <div style={{ width: 128, flexShrink: 0, paddingLeft: 14, borderLeft: `1px solid ${theme.accentSoft}`, display: "flex", flexDirection: "column", gap: 15 }}>
              {data.skills.length > 0 && (
                <div>
                  <div style={head}>{t.skills}</div>
                  <ul style={{ listStyleType: "disc", margin: 0, paddingLeft: 12, fontSize: 10.5, lineHeight: 1.6 }}>
                    {data.skills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.languages.length > 0 && (
                <div>
                  <div style={head}>{t.languages}</div>
                  {data.languages.map((l) => (
                    <div key={l.name} style={{ fontSize: 10.5, lineHeight: 1.5 }}>
                      {languageLine(l, locale)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CvPageFrame>
  );
}
