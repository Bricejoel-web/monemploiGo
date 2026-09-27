import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";
import { cvLabels } from "@/lib/cv/labels";

function Bullet({ color }: { color: string }) {
  return <span style={{ position: "absolute", left: 0, top: 5, width: 5, height: 5, background: color }} />;
}

export function StdDeuxColonnes({ data, theme, includePhoto, locale = "fr" }: CvLayoutProps) {
  const t = cvLabels[locale];
  const headStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: theme.accent, marginBottom: 10 };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", overflow: "hidden", fontFamily: "'Work Sans', sans-serif", color: "#26221f" }}>
        <div style={{ width: "34%", borderRight: "1px solid #e2e0dc", padding: "40px 22px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
          {includePhoto && (
            <div style={{ marginBottom: -4 }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={72 * (data.photoScale ?? 1)} ringColor="#fff" bg={theme.accentSoft} iconColor={theme.accent} />
            </div>
          )}
          <div style={{ fontSize: 10.5, color: "#8a8580", lineHeight: 1.7 }}>
            {data.phone}<br />{data.email}<br />{data.address}
          </div>
          {data.skills.length > 0 && (
          <div>
            <div style={headStyle}>{t.skills}</div>
            {data.skills.map((skill, i) => (
              <div key={skill} style={{ fontSize: 11.5, marginBottom: i === data.skills.length - 1 ? 0 : 8, paddingLeft: 10, position: "relative" }}>
                <Bullet color={theme.accent} />{skill}
              </div>
            ))}
          </div>
          )}
          {data.languages.length > 0 && (
          <div>
            <div style={headStyle}>{t.languages}</div>
            {data.languages.map((lang, i) => (
              <div key={lang.name} style={{ fontSize: 11.5, marginBottom: i === data.languages.length - 1 ? 0 : 8 }}>{lang.name} — {lang.level}</div>
            ))}
          </div>
          )}
        </div>

        {/* La colonne principale reste un enfant flex "étiré" (comme avant)
            pour que le filet vertical du panneau latéral reste toujours
            aussi haut que le contenu le plus long des deux colonnes. Mais
            l'étirement de CE conteneur ne doit jamais influencer la mesure
            de hauteur "naturelle" faite par AdaptiveZone (sinon, agrandir
            la photo — qui allonge la colonne latérale — se répercutait à
            tort sur le zoom du nom/texte de la colonne principale). En
            isolant AdaptiveZone dans un simple bloc non étiré à l'intérieur
            de ce conteneur, sa mesure ne dépend plus que de son propre
            contenu texte. */}
        <div style={{ width: `${(1 - 0.34) * 480}px` }}>
          <AdaptiveZone targetHeight={679 - 68} deps={[data]} style={{ padding: "40px 40px 28px 30px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700 }}>{data.fullName || t.namePlaceholder}</h1>
              <div style={{ fontSize: 13, fontWeight: 500, color: theme.accent, marginTop: 3 }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
            </div>
            {data.summary && (
              <div>
                <div style={headStyle}>{t.profile}</div>
                <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{data.summary}</p>
              </div>
            )}
            {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
              <div>
                <div style={headStyle}>{t.experience}</div>
                {data.experience.map((exp, i) => (
                  <div key={i} style={{ marginBottom: i === data.experience.length - 1 ? 0 : 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</div>
                    <div style={{ fontSize: 11.5, color: theme.accent, margin: "1px 0 4px" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}{(exp.start || exp.end) ? ` · ${exp.start} – ${exp.end}` : ""}</div>
                    {exp.description && <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a453f", margin: 0 }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
            <div>
              <div style={headStyle}>{t.education}</div>
              {data.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: i === data.education.length - 1 ? 0 : 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ed.degree}</div>
                  <div style={{ fontSize: 11.5, color: theme.accent }}>{ed.school}{(ed.start || ed.end) ? ` · ${ed.start} – ${ed.end}` : ""}</div>
                </div>
              ))}
            </div>
            )}
          </AdaptiveZone>
        </div>
      </div>
    </CvPageFrame>
  );
}
