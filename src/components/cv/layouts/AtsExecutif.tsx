import type { CvLayoutProps } from "./shared";
import { CvPageFrame, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

function DescriptionBlock({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, fontSize: 11.5, lineHeight: 1.55 }}>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p style={{ fontSize: 11.5, lineHeight: 1.55, margin: "2px 0 0" }}>{text}</p>;
}

// Un CV "ATS" au sens propre du terme est en noir/gris foncé sur blanc,
// sans icône ni photo : la mise en forme (icônes, barres de compétences,
// vraie couleur) n'empêche pas forcément la lecture automatique par les
// vrais logiciels de recrutement, mais c'est la convention universelle du
// genre — et c'est ce que les utilisateurs de cette catégorie attendent
// explicitement. `theme.accent`/`theme.textMuted` restent ici utilisés,
// mais uniquement pour de subtiles nuances de gris strictement
// achromatiques (voir src/lib/cv/themes.ts) — jamais une vraie teinte.
export function AtsExecutif({ data, theme, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", borderBottom: `1.5px solid ${theme.accent}`, paddingBottom: 5, marginBottom: 9 };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'IBM Plex Sans', sans-serif", color: "#1c1b1a", padding: "38px 42px 26px 42px" }}>
        <div style={{ borderBottom: `3px solid ${theme.accent}`, paddingBottom: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 27, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</div>
          <div style={{ fontSize: 13, color: theme.accent, marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>{[data.email, data.phone, data.address].filter(Boolean).join("  •  ")}</div>
        </div>

        <AdaptiveZone targetHeight={679 - 130} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 19 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>{t.profile}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>{t.experience}</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</span>
                    {(exp.start || exp.end) && <span style={{ fontSize: 11, color: theme.textMuted }}>{exp.start} – {exp.end}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: theme.accent, margin: "1px 0 5px" }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</div>
                  <DescriptionBlock text={exp.description} />
                </div>
              ))}
            </div>
          )}
          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>{t.education}</div>
            {data.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</span>
                  {(ed.start || ed.end) && <span style={{ fontSize: 11, color: theme.textMuted }}>{ed.start} – {ed.end}</span>}
                </div>
                <div style={{ fontSize: 12, color: theme.accent }}>{ed.school}</div>
              </div>
            ))}
          </div>
          )}
          {data.skills.length > 0 && (
          <div>
            <div style={headStyle}>{t.skills}</div>
            <p style={{ fontSize: 11.5, margin: 0 }}>{data.skills.join(" · ")}</p>
          </div>
          )}
          {data.languages.length > 0 && (
          <div>
            <div style={headStyle}>{t.languages}</div>
            <p style={{ fontSize: 11.5, margin: 0 }}>{data.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p>
          </div>
          )}
        </AdaptiveZone>

        <div style={{ borderTop: "1px solid #d8d5cf", marginTop: 18, paddingTop: 8, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: theme.textMuted }}>Page 1/1</span>
        </div>
      </div>
    </CvPageFrame>
  );
}
