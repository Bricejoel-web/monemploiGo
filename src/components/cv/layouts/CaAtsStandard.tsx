import type { CvLayoutProps } from "./shared";
import { CvPageFrame } from "./shared";
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

// Réglages communs aux CV Canada ATS pour une extraction de texte fiable :
// police intégrée au site (identique sur le serveur PDF), pas d'espacement
// des lettres (lu « P R O F I L » par certains outils), pas de ligatures
// (« fi » extrait comme un caractère spécial).
export const ATS_TEXT: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontVariantLigatures: "none",
  fontFeatureSettings: '"liga" 0, "clig" 0',
  letterSpacing: "normal",
};

// CV Canadien ATS, modèle 1 : une seule colonne lue de haut en bas, titres
// standards en majuscules soulignés d'un simple filet gris, coordonnées en
// texte brut, compétences séparées par des virgules, réalisations en puces
// textuelles. Aucune photo, icône, colonne ni tableau. Ordre strict : nom,
// titre, coordonnées, résumé, compétences, expérience, formation,
// certifications, langues.
export function CaAtsStandard({ data, theme, locale = "fr" }: CvLayoutProps) {
  const t = canadaCvLabels[locale];
  const certifications = certificationsOf(data);
  const headStyle: React.CSSProperties = {
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: "uppercase",
    color: theme.accent,
    borderBottom: "1px solid #bdbdbd",
    paddingBottom: 3,
    marginBottom: 7,
  };
  const body: React.CSSProperties = { fontSize: 11, lineHeight: 1.55, margin: 0 };
  const entry: React.CSSProperties = { breakInside: "avoid" };

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
          padding: "36px 40px 26px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</div>
          <div style={{ fontSize: 12.5, marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5, overflowWrap: "anywhere" }}>{contactItems(data).join(" | ")}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.summary.trim() && (
            <div>
              <div style={headStyle}>{t.summary}</div>
              <p style={body}>{data.summary}</p>
            </div>
          )}

          {data.skills.length > 0 && (
            <div>
              <div style={headStyle}>{t.skills}</div>
              <p style={body}>{data.skills.join(", ")}</p>
            </div>
          )}

          {hasExperience(data) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              {byRecency(data.experience).map((exp, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 11 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{exp.role}</div>
                  <div style={{ fontSize: 11 }}>{[exp.company, exp.location].filter(Boolean).join(" — ")}</div>
                  <div style={{ fontSize: 10.5, color: theme.textMuted }}>{dateRange(exp.start, exp.end, locale)}</div>
                  {exp.description &&
                    achievementLines(exp.description).map((line, j) => (
                      <div key={j} style={{ fontSize: 10.5, lineHeight: 1.5, paddingLeft: 10, textIndent: -10, marginTop: j === 0 ? 3 : 0 }}>
                        • {line}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}

          {hasEducation(data) && (
            <div>
              <div style={headStyle}>{t.education}</div>
              {byRecency(data.education).map((ed, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 7 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{ed.degree}</div>
                  <div style={{ fontSize: 11 }}>{[ed.school, ed.location].filter(Boolean).join(" — ")}</div>
                  <div style={{ fontSize: 10.5, color: theme.textMuted }}>{dateRange(ed.start, ed.end, locale)}</div>
                </div>
              ))}
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <div style={headStyle}>{t.certifications}</div>
              {certifications.map((c, i) => (
                <div key={i} style={{ ...entry, marginTop: i === 0 ? 0 : 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{c.name}</div>
                  {certificationDetail(c) && <div style={{ fontSize: 10.5 }}>{certificationDetail(c)}</div>}
                </div>
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
