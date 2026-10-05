import type { CvData } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import type { CanadaModel } from "@/lib/cv/canada/models";
import { CvPageFrame, PhotoCircle } from "../layouts/shared";
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

// Moteur unique des CV canadiens : le modèle (src/lib/cv/canada/models.ts)
// ne décrit que la disposition et la typographie. Ordre officiel des
// sections, sections vides masquées, expériences du plus récent au plus
// ancien, langue du document, et règles ATS (une colonne, aucune photo,
// aucun espacement des lettres ni ligature) sont appliqués ici, une fois
// pour toutes. La hauteur n'est jamais forcée : 1 ou 2 pages selon le
// contenu, sans agrandissement du texte.

// Coupure possible seulement avant « @ » et après « / » : une adresse ou un
// lien trop long pour une colonne étroite ne se coupe jamais en plein mot.
function breakable(text: string) {
  return text.split(/(?=@)|(?<=\/)/).flatMap((part, i) => (i === 0 ? [part] : [<wbr key={i} />, part]));
}

const FONTS = { sans: "'IBM Plex Sans', sans-serif", serif: "'Source Serif 4', Georgia, serif", grotesk: "'Space Grotesk', 'IBM Plex Sans', sans-serif" };
const GAPS = { compact: 10, normal: 14, airy: 16 };
// Les marges intérieures sont répétées en haut et en bas de chaque page :
// sans cela, la page 2 d'un CV commençait collée au bord de la feuille
// (impression sans marge, voir globals.css). Chromium 130 et plus.
// Marges de la page, identiques pour tous les modèles (demande de
// l'utilisateur : 14 à 15 mm paraissaient trop grands). En px de conception :
// 27 ≈ 12 mm sur les côtés (environ un demi-pouce, valeur courante pour un
// CV canadien), 24 ≈ 10,5 mm en haut et en bas de chaque page.
const MARGIN = 27;
const MARGIN_Y = 24;
const PAGE_FRAGMENTS: React.CSSProperties = { boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };

interface Props {
  data: CvData;
  model: CanadaModel;
  includePhoto: boolean;
  locale: Locale;
}

export function CanadaCv({ data, model, includePhoto, locale }: Props) {
  const ats = model.category === "CANADA_ATS";
  const t = canadaCvLabels[locale];
  const c = model.colors;
  const gap = GAPS[model.density];
  const sidebar = !ats && model.layout.columns === "sidebar" ? model.layout : null;
  const certifications = certificationsOf(data);
  const contacts = contactItems(data);
  const showPhoto = !ats && includePhoto && Boolean(data.photoDataUrl);
  const body: React.CSSProperties = { fontSize: model.type.body, lineHeight: 1.5, margin: 0 };
  const muted: React.CSSProperties = { ...body, color: c.muted };

  const heading = (children: string) => (
    <div
      style={{
        fontFamily: FONTS[model.type.headingFont],
        fontSize: model.type.heading,
        fontWeight: 700,
        color: c.accent,
        textTransform: model.headings.case === "upper" ? "uppercase" : undefined,
        fontVariant: model.headings.case === "smallcaps" && !ats ? "small-caps" : undefined,
        letterSpacing: !ats && model.headings.case === "upper" ? "0.06em" : "normal",
        borderBottom: model.headings.style === "rule" ? `1px solid ${c.rule}` : undefined,
        borderLeft: model.headings.style === "bar" ? `3px solid ${c.accent}` : undefined,
        paddingLeft: model.headings.style === "bar" ? 7 : 0,
        paddingBottom: model.headings.style === "rule" ? 3 : 0,
        textDecoration: model.headings.style === "underline" ? "underline" : undefined,
        textUnderlineOffset: model.headings.style === "underline" ? 2 : undefined,
        marginBottom: 6,
        breakAfter: "avoid",
      }}
    >
      {children}
    </div>
  );

  const datedTitle = (title: string, dates: string) =>
    model.dates === "right" ? (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <span style={{ ...body, fontWeight: 700, fontSize: model.type.body + 1 }}>{title}</span>
        {dates && <span style={{ ...muted, whiteSpace: "nowrap" }}>{dates}</span>}
      </div>
    ) : (
      <p style={{ ...body, fontWeight: 700, fontSize: model.type.body + 1 }}>{title}</p>
    );

  // Lignes d'une expérience selon le modèle : poste puis entreprise (par
  // défaut), entreprise puis poste, ou poste et entreprise sur une ligne.
  const lead = model.entry?.lead === "company";
  const entryTitle = (e: { role: string; company: string }) =>
    model.entry?.inline ? [e.role, e.company].filter(Boolean).join(" — ") : lead && e.company ? e.company : e.role;
  const subLine = (parts: (string | undefined)[], dates: string) => {
    const text = parts.filter(Boolean).join(" — ");
    return model.dates === "inline" && dates ? [text, dates].filter(Boolean).join(" | ") : text;
  };
  const datesBefore = (dates: string) => model.dates === "before" && dates && <p style={muted}>{dates}</p>;
  const datesBelow = (dates: string) => model.dates === "below" && dates && <p style={muted}>{dates}</p>;

  const withDates = (dates: string, content: React.ReactNode) =>
    model.dates === "margin" ? (
      <div style={{ display: "grid", gridTemplateColumns: "62px minmax(0, 1fr)", columnGap: 12 }}>
        <p style={{ ...muted, fontSize: model.type.body - 0.5, paddingTop: 1 }}>{dates}</p>
        <div>{content}</div>
      </div>
    ) : (
      content
    );

  const summary = data.summary.trim() && (
    <section key="summary">
      {heading(t.summary)}
      <p style={model.summaryBox ? { ...body, background: c.tint, borderLeft: `3px solid ${c.accent}`, padding: "8px 11px" } : body}>{data.summary}</p>
    </section>
  );

  const skills = data.skills.length > 0 && (
    <section key="skills">
      {heading(t.skills)}
      {model.skills === "inline" || ats ? (
        <p style={body}>{data.skills.join(", ")}</p>
      ) : (
        <ul style={{ ...body, listStyleType: "disc", paddingLeft: 14, columns: model.skills === "columns" && !sidebar ? 2 : 1, columnGap: 18 }}>
          {data.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );

  const experience = hasExperience(data) && (
    <section key="experience">
      {heading(t.experience)}
      {byRecency(data.experience).map((exp, i) => {
        const dates = dateRange(exp.start, exp.end, locale);
        return (
          <div key={i} style={{ breakInside: "avoid", marginTop: i === 0 ? 0 : gap * 0.75 }}>
            {withDates(
              dates,
              <>
                {datesBefore(dates)}
                {datedTitle(entryTitle(exp), dates)}
                {subLine(model.entry?.inline ? [exp.location] : lead && exp.company ? [exp.role, exp.location] : [exp.company, exp.location], dates) && (
                  <p style={body}>{subLine(model.entry?.inline ? [exp.location] : lead && exp.company ? [exp.role, exp.location] : [exp.company, exp.location], dates)}</p>
                )}
                {datesBelow(dates)}
                {exp.description && (
                  <div style={{ marginTop: 2 }}>
                    {achievementLines(exp.description).map((line, j) => (
                      <p key={j} style={{ ...body, paddingLeft: 11, textIndent: -11 }}>
                        {c.bullet ? <span style={{ color: c.bullet }}>•</span> : "•"} {line}
                      </p>
                    ))}
                  </div>
                )}
              </>,
            )}
          </div>
        );
      })}
    </section>
  );

  const education = hasEducation(data) && (
    <section key="education">
      {heading(t.education)}
      {byRecency(data.education).map((ed, i) => {
        const dates = dateRange(ed.start, ed.end, locale);
        return (
          <div key={i} style={{ breakInside: "avoid", marginTop: i === 0 ? 0 : gap / 2 }}>
            {withDates(
              dates,
              <>
                {datesBefore(dates)}
                {datedTitle(ed.degree, dates)}
                {subLine([ed.school, ed.location], dates) && <p style={body}>{subLine([ed.school, ed.location], dates)}</p>}
                {datesBelow(dates)}
              </>,
            )}
          </div>
        );
      })}
    </section>
  );

  const certs = certifications.length > 0 && (
    <section key="certifications">
      {heading(t.certifications)}
      {certifications.map((cert, i) => (
        <div key={i} style={{ breakInside: "avoid", marginTop: i === 0 ? 0 : 4 }}>
          <p style={{ ...body, fontWeight: 600 }}>{cert.name}</p>
          {certificationDetail(cert) && <p style={muted}>{certificationDetail(cert)}</p>}
        </div>
      ))}
    </section>
  );

  const languages = data.languages.length > 0 && (
    <section key="languages">
      {heading(t.languages)}
      {data.languages.map((l) => (
        <p key={l.name} style={body}>
          {languageLine(l, locale)}
        </p>
      ))}
    </section>
  );

  const contactBlock = contacts.length > 0 && (
    <section key="contacts">
      {contacts.map((item) => (
        <p key={item} style={{ ...body, overflowWrap: "break-word" }}>
          {breakable(item)}
        </p>
      ))}
    </section>
  );

  const h = model.header;
  const dark = h.band === "dark";
  const onBand = dark ? "#ffffff" : undefined;
  // Coordonnées sous la ligne : la ligne sépare alors le titre des coordonnées.
  const belowRule = h.contactsBelowRule && h.rule !== "none";
  const contactsLine = contacts.length > 0 && (
    <p style={{ ...muted, color: dark ? "rgba(255,255,255,0.85)" : c.muted, marginTop: 6, overflowWrap: "anywhere", whiteSpace: h.contacts === "stacked" ? "pre-line" : undefined }}>
      {contacts.join(h.contacts === "inline" ? "  |  " : "\n")}
    </p>
  );
  const header = (
    <div
      style={{
        display: "flex",
        alignItems: h.align === "split" ? "flex-start" : "center",
        justifyContent: h.align === "split" ? "space-between" : undefined,
        flexDirection: h.align === "center" ? "column" : "row",
        textAlign: h.align === "center" ? "center" : "left",
        gap: h.align === "center" ? 8 : 14,
        background: dark ? c.accent : h.band ? c.tint : undefined,
        color: onBand,
        padding: h.band ? "14px 16px" : undefined,
        paddingBottom: h.band ? 14 : h.rule === "none" ? 0 : 12,
        borderBottom: belowRule ? undefined : h.rule === "thick" ? `2px solid ${c.line ?? c.accent}` : h.rule === "thin" ? `1px solid ${c.rule}` : undefined,
        marginBottom: gap + 2,
      }}
    >
      {showPhoto && <PhotoCircle photoDataUrl={data.photoDataUrl} size={h.align === "center" ? 46 : 62} ringWidth={0} />}
      <div style={{ minWidth: 0, flex: h.align === "center" ? undefined : "1 1 0" }}>
        <div style={{ fontFamily: FONTS[model.type.headingFont], fontSize: model.type.name, fontWeight: 700, lineHeight: 1.15, color: ats ? c.text : onBand ?? c.accent }}>
          {data.fullName || t.namePlaceholder}
        </div>
        <div style={{ fontSize: model.type.title, fontWeight: h.titleBold ? 700 : 500, marginTop: 3, color: c.highlight }}>{data.jobTitle || t.jobTitlePlaceholder}</div>
        {h.accentMark && <div aria-hidden="true" style={{ width: 36, height: 3, background: c.accent, marginTop: 5, marginInline: h.align === "center" ? "auto" : undefined }} />}
        {/* Avec une colonne secondaire, les coordonnées vont dans cette colonne. */}
        {!sidebar && h.align !== "split" && !belowRule && contactsLine}
        {!sidebar && h.align !== "split" && belowRule && (
          <div style={{ borderTop: h.rule === "thick" ? `2px solid ${c.line ?? c.accent}` : `1px solid ${c.rule}`, marginTop: 10, paddingTop: 2 }}>{contactsLine}</div>
        )}
      </div>
      {!sidebar && h.align === "split" && <div style={{ textAlign: h.contactsRight ? "right" : undefined }}>{contactBlock}</div>}
    </div>
  );

  const stack = (items: React.ReactNode[]) => <div style={{ display: "flex", flexDirection: "column", gap }}>{items.filter(Boolean)}</div>;

  return (
    <CvPageFrame>
      <div
        style={{
          width: 480,
          minHeight: 679,
          background: "#fff",
          color: c.text,
          fontFamily: FONTS.sans,
          display: "flex",
          flexDirection: "column",
          ...(ats ? { fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "clig" 0' } : {}),
        }}
      >
        {sidebar?.headerFull ? (
          <div style={{ ...PAGE_FRAGMENTS, padding: `${MARGIN_Y}px 0`, flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: `0 ${MARGIN}px` }}>{header}</div>
            <div style={{ display: "flex", flex: "1 1 auto", flexDirection: sidebar.side === "left" ? "row" : "row-reverse" }}>
              <div
                style={{
                  width: `${sidebar.width}%`,
                  flexShrink: 0,
                  background: sidebar.tinted ? c.tint : undefined,
                  // Colonne teintée : marge intérieure pour que le texte ne touche pas le bord du fond.
                  padding: sidebar.tinted ? "14px 16px" : "0 16px",
                  [sidebar.side === "left" ? "borderRight" : "borderLeft"]: sidebar.tinted ? undefined : `1px solid ${c.rule}`,
                }}
              >
                {stack([contactBlock, skills, languages])}
              </div>
              <div style={{ flex: "1 1 0", minWidth: 0, padding: `0 ${MARGIN}px` }}>{stack([summary, experience, education, certs])}</div>
            </div>
          </div>
        ) : sidebar ? (
          <div style={{ display: "flex", flex: "1 1 auto", flexDirection: sidebar.side === "left" ? "row" : "row-reverse" }}>
            <div
              style={{
                width: `${sidebar.width}%`,
                flexShrink: 0,
                background: sidebar.tinted ? c.tint : undefined,
                ...PAGE_FRAGMENTS,
                padding: `${MARGIN_Y}px 16px`,
                [sidebar.side === "left" ? "borderRight" : "borderLeft"]: sidebar.tinted ? undefined : `1px solid ${c.rule}`,
              }}
            >
              {stack([contactBlock, skills, languages])}
            </div>
            <div style={{ ...PAGE_FRAGMENTS, flex: "1 1 0", minWidth: 0, padding: `${MARGIN_Y}px ${MARGIN}px` }}>
              {header}
              {stack([summary, experience, education, certs])}
            </div>
          </div>
        ) : (
          <div style={{ ...PAGE_FRAGMENTS, padding: `${MARGIN_Y}px ${MARGIN}px` }}>
            {header}
            {stack([summary, skills, experience, education, certs, languages])}
          </div>
        )}
      </div>
    </CvPageFrame>
  );
}
