import type { CanadaLetterContent } from "@/lib/letters/canada/profile";
import { buildCanadaLetter } from "@/lib/letters/canada/generate";
import { CvPageFrame } from "@/components/cv/layouts/shared";
import { displayUrl } from "@/lib/cv/canada-labels";
import type { LetterModel } from "@/lib/letters/canada/models";

export { LETTER_MODELS } from "@/lib/letters/canada/models";

// Le pays de résidence suit la langue de la lettre (« Cameroun » / « Cameroon »).
const localizeCountry = (country: string, fr: boolean) => (/^camero(u|o)n$/i.test(country.trim()) ? (fr ? "Cameroun" : "Cameroon") : country);

// Lettre de présentation Canada : modèles décrits par configuration
// (LETTER-CAN-01 à 06), rendus par les mêmes blocs (en-tête, destinataire,
// objet, corps, signature). Marges identiques aux CV Canada (12 mm sur les
// côtés, 10,5 mm en haut et en bas) ; le texte n'est jamais agrandi pour
// remplir la page.


const MARGIN = 27;
const MARGIN_Y = 24;
const body: React.CSSProperties = { fontSize: 10, lineHeight: 1.6, margin: 0 };

function LetterHeader({ content, model }: { content: CanadaLetterContent; model: LetterModel }) {
  const p = content.profile.personalInfo;
  const c = model.colors;
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
  const contacts = [[p.city, localizeCountry(p.country, content.options.language === "fr")].filter(Boolean).join(", "), p.phone, p.email, p.linkedin && displayUrl(p.linkedin), p.website && displayUrl(p.website)].filter(Boolean);
  const title = content.profile.professionalTitle.trim();

  if (model.header === "split") {
    return (
      <div style={{ padding: `${MARGIN_Y}px ${MARGIN}px 12px`, display: "flex", justifyContent: "space-between", gap: 16, borderBottom: `1.5px solid ${c.rule}`, margin: `0 ${MARGIN}px`, paddingInline: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: c.accent, lineHeight: 1.15 }}>{name}</div>
          {title && <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3 }}>{title}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          {contacts.map((item) => (
            <p key={item} style={{ ...body, color: c.muted }}>
              {item}
            </p>
          ))}
        </div>
      </div>
    );
  }
  if (model.header === "executive") {
    return (
      <div style={{ padding: `${MARGIN_Y + 4}px ${MARGIN}px 0` }}>
        <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 25, fontWeight: 700, color: c.accent, lineHeight: 1.1 }}>{name}</div>
        {title && <div style={{ fontSize: 11.5, marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase", color: c.muted }}>{title}</div>}
        <div style={{ borderTop: `1px solid ${c.rule}`, marginTop: 10, paddingTop: 6 }}>
          <p style={{ ...body, color: c.muted }}>{contacts.join("  ·  ")}</p>
        </div>
      </div>
    );
  }
  if (model.header === "modern") {
    return (
      <div style={{ padding: `${MARGIN_Y}px ${MARGIN}px 0`, display: "flex", gap: 12 }}>
        <div aria-hidden="true" style={{ width: 5, borderRadius: 3, background: c.accent, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: c.accent, lineHeight: 1.15 }}>{name}</div>
          {title && <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{title}</div>}
          <p style={{ ...body, fontSize: 9.5, color: c.muted, marginTop: 4 }}>{contacts.join("  |  ")}</p>
        </div>
      </div>
    );
  }
  if (model.header === "minimal") {
    return (
      <div style={{ padding: `${MARGIN_Y + 6}px ${MARGIN}px 0` }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.01em" }}>{name}</div>
        <p style={{ ...body, color: c.muted, marginTop: 3 }}>{contacts.join(" — ")}</p>
      </div>
    );
  }
  if (model.header === "band") {
    return (
      <div style={{ background: c.band, padding: `${MARGIN_Y}px ${MARGIN}px 14px`, borderBottom: `2px solid ${c.rule}` }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: c.accent, lineHeight: 1.15 }}>{name}</div>
        {title && <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3 }}>{title}</div>}
        <p style={{ ...body, color: c.muted, marginTop: 5 }}>{contacts.join("  |  ")}</p>
      </div>
    );
  }
  return (
    <div style={{ padding: `${MARGIN_Y}px ${MARGIN}px 0` }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: c.accent, lineHeight: 1.15 }}>{name}</div>
      {contacts.map((item) => (
        <p key={item} style={{ ...body, color: c.muted }}>
          {item}
        </p>
      ))}
    </div>
  );
}

function LetterRecipient({ content }: { content: CanadaLetterContent }) {
  const j = content.job;
  const place = [j.city, j.province].map((v) => v?.trim()).filter(Boolean).join(", ");
  return (
    <div style={{ marginBottom: 14 }}>
      {j.recruiterName?.trim() && <p style={body}>{j.recruiterName}</p>}
      {j.company.trim() && <p style={{ ...body, fontWeight: 600 }}>{j.company}</p>}
      {place && <p style={body}>{place}</p>}
    </div>
  );
}

export function CanadaLetterView({ content, model }: { content: CanadaLetterContent; model: LetterModel }) {
  const letter = buildCanadaLetter(content);
  const text: React.CSSProperties = model.airy ? { ...body, lineHeight: 1.7 } : body;
  const gap = model.airy ? 12 : 9;
  const fr = content.options.language === "fr";
  const c = model.colors;
  return (
    <CvPageFrame>
      <div style={{ width: 480, minHeight: 679, background: "#fff", color: c.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <LetterHeader content={content} model={model} />
        <div style={{ padding: `18px ${MARGIN}px ${MARGIN_Y}px` }}>
          {content.date.trim() && <p style={{ ...body, marginBottom: 12 }}>{content.date}</p>}
          <LetterRecipient content={content} />
          <p style={{ ...body, fontWeight: 700, color: model.header === "minimal" ? c.text : c.accent, marginBottom: 14 }}>
            {fr ? "Objet :" : "Re:"} {letter.subject}
          </p>
          <p style={{ ...body, marginBottom: 10 }}>{letter.salutation}</p>
          {(content.customParagraphs ?? letter.paragraphs).map((paragraph, i) => (
            <p key={i} style={{ ...text, marginBottom: gap, breakInside: "avoid" }}>
              {paragraph}
            </p>
          ))}
          <p style={{ ...body, marginTop: 6 }}>{letter.closing}</p>
          <p style={{ ...body, marginTop: 16, fontWeight: 600 }}>{letter.signature}</p>
        </div>
      </div>
    </CvPageFrame>
  );
}
