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

// CV Canadien, modèle 2 : une seule colonne de lecture. Un filet vertical
// coloré repère l'en-tête, les compétences sont présentées en grille sous
// le résumé, et chaque section porte son titre à gauche de son contenu.
// Photo facultative, jamais imposée. Ordre et contenu identiques aux
// autres CV Canada.
function Section({ title, theme, children }: { title: string; theme: CvLayoutProps["theme"]; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 104, flexShrink: 0, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: theme.accent, lineHeight: 1.35, paddingTop: 1 }}>
        {title}
      </div>
      <div style={{ flex: "1 1 0", minWidth: 0, paddingLeft: 12, borderLeft: `1px solid ${theme.accentSoft}` }}>{children}</div>
    </div>
  );
}

export function CaRepere({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = canadaCvLabels[locale];
  const certifications = certificationsOf(data);
  const entry: React.CSSProperties = { breakInside: "avoid" };
  const sub: React.CSSProperties = { fontSize: 10, color: theme.textMuted, marginTop: 1 };

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
          padding: "32px 32px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 12, borderLeft: `5px solid ${theme.accent}` }}>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.1 }}>{data.fullName || t.namePlaceholder}</div>
            <div style={{ fontSize: 12.5, marginTop: 4, color: theme.accent, fontWeight: 600 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 6, overflowWrap: "anywhere" }}>{contactItems(data).join("  |  ")}</div>
          </div>
          {includePhoto && data.photoDataUrl && <PhotoCircle photoDataUrl={data.photoDataUrl} size={60} ringWidth={0} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          {data.summary.trim() && (
            <Section theme={theme} title={t.summary}>
              <p style={{ fontSize: 11, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
            </Section>
          )}

          {data.skills.length > 0 && (
            <Section theme={theme} title={t.skills}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 12, rowGap: 3 }}>
                {data.skills.map((s) => (
                  <div key={s} style={{ fontSize: 10.5, lineHeight: 1.45, display: "flex", gap: 5 }}>
                    <span style={{ color: theme.accent }}>▪</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {hasExperience(data) && (
            <Section theme={theme} title={t.experience}>
              {byRecency(data.experience).map((exp, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 11 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{exp.role}</div>
                  <div style={{ fontSize: 10.5 }}>{[exp.company, exp.location].filter(Boolean).join(" — ")}</div>
                  <div style={sub}>{dateRange(exp.start, exp.end, locale)}</div>
                  {exp.description && (
                    <ul style={{ listStyleType: "disc", margin: "4px 0 0", paddingLeft: 14, fontSize: 10.5, lineHeight: 1.5 }}>
                      {achievementLines(exp.description).map((line, j) => (
                        <li key={j}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {hasEducation(data) && (
            <Section theme={theme} title={t.education}>
              {byRecency(data.education).map((ed, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 7 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{ed.degree}</div>
                  <div style={sub}>{[[ed.school, ed.location].filter(Boolean).join(" — "), dateRange(ed.start, ed.end, locale)].filter(Boolean).join("  ·  ")}</div>
                </div>
              ))}
            </Section>
          )}

          {certifications.length > 0 && (
            <Section theme={theme} title={t.certifications}>
              {certifications.map((c, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</div>
                  {certificationDetail(c) && <div style={sub}>{certificationDetail(c)}</div>}
                </div>
              ))}
            </Section>
          )}

          {data.languages.length > 0 && (
            <Section theme={theme} title={t.languages}>
              {data.languages.map((l) => (
                <div key={l.name} style={{ fontSize: 10.5, lineHeight: 1.5 }}>
                  {languageLine(l, locale)}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </CvPageFrame>
  );
}
