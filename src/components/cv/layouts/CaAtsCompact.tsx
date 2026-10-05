import type { CvLayoutProps } from "./shared";
import { CvPageFrame } from "./shared";
import { ATS_TEXT } from "./CaAtsStandard";
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

// CV Canadien ATS, modèle 2 : variante compacte pour les parcours plus
// longs. Nom aligné à gauche, une coordonnée par ligne, titres de section
// en gras sans décoration, chaque poste tient sur une ligne de texte
// (poste | employeur | lieu | dates) suivie de ses réalisations. Une seule
// colonne, aucun élément graphique, même ordre strict que le modèle 1.
export function CaAtsCompact({ data, theme, locale = "fr" }: CvLayoutProps) {
  const t = canadaCvLabels[locale];
  const certifications = certificationsOf(data);
  const headStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: theme.accent, marginBottom: 4 };
  const body: React.CSSProperties = { fontSize: 10.5, lineHeight: 1.5, margin: 0 };
  const entry: React.CSSProperties = { breakInside: "avoid" };
  const pipeLine = (parts: string[]) => parts.filter((p) => p.trim()).map((p) => ` | ${p}`).join("");

  return (
    <CvPageFrame>
      <div
        style={{
          ...ATS_TEXT,
          width: 480,
          minHeight: 679,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          color: theme.text,
          padding: "32px 38px 24px",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 21, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          <div style={{ marginTop: 4 }}>
            {contactItems(data).map((item) => (
              <p key={item} style={{ ...body, overflowWrap: "anywhere" }}>
                {item}
              </p>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.summary.trim() && (
            <div>
              <div style={headStyle}>{t.summary}</div>
              <p style={body}>{data.summary}</p>
            </div>
          )}

          {data.skills.length > 0 && (
            <div>
              <div style={headStyle}>{t.skills}</div>
              <p style={body}>{data.skills.join(" · ")}</p>
            </div>
          )}

          {hasExperience(data) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              {byRecency(data.experience).map((exp, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 8 }}>
                  <p style={{ ...body, fontSize: 11 }}>
                    <strong>{exp.role}</strong>
                    {pipeLine([exp.company, exp.location ?? "", dateRange(exp.start, exp.end, locale)])}
                  </p>
                  {exp.description &&
                    achievementLines(exp.description).map((line, j) => (
                      <p key={j} style={{ ...body, paddingLeft: 10, textIndent: -10 }}>
                        - {line}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          )}

          {hasEducation(data) && (
            <div>
              <div style={headStyle}>{t.education}</div>
              {byRecency(data.education).map((ed, i) => (
                <p key={i} style={{ ...body, ...entry, fontSize: 11, marginTop: i === 0 ? 0 : 3 }}>
                  <strong>{ed.degree}</strong>
                  {pipeLine([ed.school, ed.location ?? "", dateRange(ed.start, ed.end, locale)])}
                </p>
              ))}
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <div style={headStyle}>{t.certifications}</div>
              {certifications.map((c, i) => (
                <p key={i} style={{ ...body, ...entry, fontSize: 11 }}>
                  <strong>{c.name}</strong>
                  {pipeLine([certificationDetail(c)])}
                </p>
              ))}
            </div>
          )}

          {data.languages.length > 0 && (
            <div>
              <div style={headStyle}>{t.languages}</div>
              {data.languages.map((l) => (
                <p key={l.name} style={body}>
                  {languageLine(l, locale)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </CvPageFrame>
  );
}
