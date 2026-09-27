import type { CvLayoutProps } from "./shared";
import { CvPageFrame, PhotoCircle, AdaptiveZone } from "./shared";

// Les intitulés de ce modèle restent en allemand quelle que soit la langue
// du site : le document est destiné à un employeur allemand (voir
// docs/ROADMAP.md, décision "CV Allemagne").
function Row({ label, children, muted }: { label: string; children: React.ReactNode; muted: string }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 7 }}>
      <div style={{ width: 100, flexShrink: 0, fontSize: 11, color: muted, fontWeight: 500, paddingTop: 1 }}>{label}</div>
      <div style={{ fontSize: 11, flex: 1 }}>{children}</div>
    </div>
  );
}

// Comme AtsExecutif.tsx, ce modèle appartient à une catégorie "ATS"
// (GERMAN_ATS) : `theme.accent`/`theme.textMuted` restent utilisés, mais
// uniquement pour de subtiles nuances de gris strictement achromatiques
// (voir src/lib/cv/themes.ts) — jamais une vraie teinte. Un vrai
// Lebenslauf/CV ATS reste en noir/gris foncé sur blanc.
export function DeTabellarisch({ data, theme, includePhoto }: CvLayoutProps) {
  const headStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: theme.accent, borderBottom: `1.5px solid ${theme.accent}`, paddingBottom: 5, marginBottom: 10 };

  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'IBM Plex Sans', sans-serif", color: "#1c1b1a", padding: "34px 42px 22px 42px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".15em", textTransform: "uppercase", color: "#8a8580" }}>Lebenslauf</div>
            <div style={{ fontSize: 25, fontWeight: 700, marginTop: 4 }}>{data.fullName || "Ihr Name"}</div>
            <div style={{ fontSize: 12, color: theme.accent, marginTop: 2 }}>{data.jobTitle || "Bewerbung um einen Ausbildungsplatz"}</div>
          </div>
          {includePhoto && (
            <div style={{ flexShrink: 0 }}>
              <PhotoCircle photoDataUrl={data.photoDataUrl} size={78 * (data.photoScale ?? 1)} ringColor="#c9c6c0" ringWidth={1.5} bg="#f4f3f1" iconColor="#9a958e" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={headStyle}>Persönliche Daten</div>
          {data.birthDate && <Row muted={theme.textMuted} label="Geburtsdatum">{data.birthDate}</Row>}
          {data.birthPlace && <Row muted={theme.textMuted} label="Geburtsort">{data.birthPlace}</Row>}
          {data.nationality && <Row muted={theme.textMuted} label="Staatsangehörigkeit">{data.nationality}</Row>}
          {data.address && <Row muted={theme.textMuted} label="Adresse">{data.address}</Row>}
          {data.phone && <Row muted={theme.textMuted} label="Telefon">{data.phone}</Row>}
          {data.email && <Row muted={theme.textMuted} label="E-Mail">{data.email}</Row>}
        </div>

        <AdaptiveZone targetHeight={679 - 240} deps={[data]} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {data.summary && (
            <div>
              <div style={headStyle}>Profil</div>
              <p style={{ fontSize: 11, lineHeight: 1.55, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experience.some((exp) => exp.role.trim() || exp.company.trim()) && (
            <div>
              <div style={headStyle}>Berufserfahrung</div>
              {data.experience.map((exp, i) => (
                <Row muted={theme.textMuted} key={i} label={exp.start || exp.end ? `${exp.start} – ${exp.end}` : ""}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{exp.role}</div>
                  <div style={{ fontSize: 11.5, color: theme.accent, marginTop: 1 }}>{exp.company}</div>
                  {exp.description && <p style={{ fontSize: 11, lineHeight: 1.5, margin: "2px 0 0" }}>{exp.description}</p>}
                </Row>
              ))}
            </div>
          )}
          {data.education.some((ed) => ed.degree.trim() || ed.school.trim()) && (
          <div>
            <div style={headStyle}>Ausbildung</div>
            {data.education.map((ed, i) => (
              <Row muted={theme.textMuted} key={i} label={ed.start || ed.end ? `${ed.start} – ${ed.end}` : ""}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{ed.degree}</div>
                <div style={{ fontSize: 11.5, color: theme.accent, marginTop: 1 }}>{ed.school}</div>
              </Row>
            ))}
          </div>
          )}
          {(data.languages.length > 0 || data.skills.length > 0) && (
          <div>
            <div style={headStyle}>Kenntnisse &amp; Sprachen</div>
            {data.languages.map((l) => (
              <Row muted={theme.textMuted} key={l.name} label={l.name}>{l.level}</Row>
            ))}
            {data.skills.length > 0 && <Row muted={theme.textMuted} label="EDV">{data.skills.join(", ")}</Row>}
          </div>
          )}
        </AdaptiveZone>
      </div>
    </CvPageFrame>
  );
}
