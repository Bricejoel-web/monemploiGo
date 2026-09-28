import type { LegalBlock, LegalDocument } from "@/data/legal/document-types";
import { LegalPage } from "./LegalPage";

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h3") return <h3 className="pt-1 font-semibold text-black/85 dark:text-white/85">{block.text}</h3>;
  if (block.type === "list") {
    return (
      <ul className="list-disc pl-5">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

/** Affiche un document juridique long (CGU, politique de confidentialité). */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <LegalPage title={document.title}>
      <p className="text-xs font-medium text-black/50 dark:text-white/50">{document.lastUpdatedLabel}</p>

      {document.intro.map((block, i) => (
        <Block key={`intro-${i}`} block={block} />
      ))}

      {document.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="font-semibold text-black dark:text-white">{section.heading}</h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}

      <p className="font-medium text-black dark:text-white">{document.closing}</p>
    </LegalPage>
  );
}
