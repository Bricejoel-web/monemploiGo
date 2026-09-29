import type { CoverLetterData, CoverLetterLayoutConfig, CvTheme } from "@/lib/cv/types";
import type { Locale } from "@/i18n/config";
import { cvLabels } from "@/lib/cv/labels";
import { AdaptiveZone } from "./layouts/AdaptiveZone";

interface CoverLetterRendererProps {
  data: CoverLetterData;
  layout: CoverLetterLayoutConfig;
  theme: CvTheme;
  locale?: Locale;
}

function Heading({
  children,
  layout,
  theme,
}: {
  children: React.ReactNode;
  layout: CoverLetterLayoutConfig;
  theme: CvTheme;
}) {
  const font = theme.headingFont === "serif" ? "font-serif" : "font-sans";
  if (layout.headingStyle === "underline") {
    return (
      <div className={`${font} text-[20px] font-bold pb-2 border-b-2`} style={{ borderColor: theme.accent }}>
        {children}
      </div>
    );
  }
  if (layout.headingStyle === "block") {
    return (
      <div className={`${font} text-[16px] font-bold text-white px-3 py-2 inline-block`} style={{ backgroundColor: theme.accent }}>
        {children}
      </div>
    );
  }
  if (layout.headingStyle === "uppercase-tracked") {
    return (
      <div className={`${font} text-[16px] font-bold uppercase tracking-[0.2em]`} style={{ color: theme.accent }}>
        {children}
      </div>
    );
  }
  return (
    <div className={`${font} text-[18px] font-bold`} style={{ color: theme.text }}>
      {children}
    </div>
  );
}

export function CoverLetterRenderer({ data, layout, theme, locale = "fr" }: CoverLetterRendererProps) {
  const t = cvLabels[locale];
  const senderBlock = (
    <div className={`text-[11px] leading-snug ${layout.showSenderBlock === "right" ? "text-right" : "text-left"}`}>
      <div className="font-semibold">{data.fullName || "Votre nom"}</div>
      <div>{data.email}</div>
      <div>{data.phone}</div>
      {data.address && <div>{data.address}</div>}
    </div>
  );

  const recipientBlock = (
    <div className={`text-[11px] leading-snug ${layout.showSenderBlock === "right" ? "text-left" : "text-right"}`}>
      {data.recipientCompany && <div className="font-semibold">{data.recipientCompany}</div>}
      {data.recipientName && <div>{data.recipientName}</div>}
      <div className="mt-2" style={{ color: theme.textMuted }}>
        {data.date}
      </div>
    </div>
  );

  return (
    <article className="a4-page flex flex-col gap-6 p-12 font-sans text-[12px]" style={{ color: theme.text }}>
      <div className="flex items-start justify-between gap-6">
        {layout.showSenderBlock === "right" ? (
          <>
            {recipientBlock}
            {senderBlock}
          </>
        ) : (
          <>
            {senderBlock}
            {recipientBlock}
          </>
        )}
      </div>

      <Heading layout={layout} theme={theme}>
        {data.subject || t.subjectPlaceholder}
      </Heading>

      <AdaptiveZone targetHeight={720} deps={[data.body]} maxScale={2.2}>
        <div className="whitespace-pre-line text-[11.5px] leading-relaxed" style={{ color: theme.text }}>
          {data.body || t.bodyPlaceholder}
        </div>

        <div className="mt-6 text-[11.5px]">
          <p>{t.regards}</p>
          <p className="mt-6 font-semibold">{data.fullName}</p>
        </div>
      </AdaptiveZone>
    </article>
  );
}
