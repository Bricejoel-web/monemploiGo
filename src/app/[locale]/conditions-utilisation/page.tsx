import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LegalPage } from "@/components/layout/LegalPage";
import { TERMS_CONTENT } from "@/data/legal/terms-content";

export default async function TermsOfUsePage({ params }: PageProps<"/[locale]/conditions-utilisation">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = TERMS_CONTENT[locale === "en" ? "en" : "fr"];

  return (
    <LegalPage title={content.title}>
      <p className="text-xs font-medium text-black/50 dark:text-white/50">{content.lastUpdatedLabel}</p>

      {content.intro.map((block, i) => (
        <p key={`intro-${i}`}>{block.type === "p" ? block.text : null}</p>
      ))}

      {content.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="font-semibold text-black dark:text-white">{section.heading}</h2>
          {section.blocks.map((block, i) =>
            block.type === "p" ? (
              <p key={i}>{block.text}</p>
            ) : (
              <ul key={i} className="list-disc pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}

      <p className="font-medium text-black dark:text-white">{content.closing}</p>
    </LegalPage>
  );
}
