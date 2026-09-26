import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { loadOwnedPaidDocument } from "@/lib/documents/load-document";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { PrintButton } from "@/components/cv/PrintButton";

export default async function DocumentPreviewPage({ params }: PageProps<"/[locale]/document/[id]/apercu">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);

  const loaded = await loadOwnedPaidDocument(id, session.userId);
  if (!loaded) notFound();

  return (
    <div className="overflow-x-auto bg-black/5 py-10 print:overflow-visible print:bg-white print:p-0 dark:bg-black">
      <PrintButton label={dict.payment.downloadPdf} />
      {/* `mx-auto` (marges automatiques) plutôt que `flex justify-center` :
          un contenu centré par flexbox qui déborde de son conteneur déborde
          symétriquement des deux côtés, y compris vers la gauche — une zone
          que le défilement standard ne peut pas atteindre (le défilement ne
          va jamais en position négative). Avec des marges automatiques, un
          débordement ne peut se produire que vers la droite, où il reste
          normalement accessible en faisant défiler horizontalement. */}
      <div className="a4-print-root w-fit mx-auto">
        {loaded.kind === "CV" ? (
          <CvRenderer
            data={loaded.data}
            layoutId={loaded.template.layoutId}
            theme={loaded.template.theme}
            includePhoto={Boolean(loaded.document.includePhoto)}
            locale={locale as Locale}
          />
        ) : loaded.kind === "BEWERBUNGSBRIEF" ? (
          <BewerbungsbriefRenderer data={loaded.data} layoutId={loaded.template.layoutId} theme={loaded.template.theme} locale={locale as Locale} />
        ) : (
          <CoverLetterRenderer data={loaded.data} layout={loaded.template.layout} theme={loaded.template.theme} locale={locale as Locale} />
        )}
      </div>
    </div>
  );
}
