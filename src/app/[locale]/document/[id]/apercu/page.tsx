import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { loadDownloadableDocument } from "@/lib/documents/load-document";
import { expiresAt } from "@/lib/documents/retention";
import { formatLongDate } from "@/lib/format-date";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { DocumentDownload } from "@/components/cv/DocumentDownload";
import { DocumentPreviewFit } from "@/components/cv/DocumentPreviewFit";
import { CheckIcon, ClockIcon } from "@/components/home/icons";
import { CvFonts } from "@/components/cv/CvFonts";

export default async function DocumentPreviewPage({ params, searchParams }: PageProps<"/[locale]/document/[id]/apercu">) {
  const { locale, id } = await params;
  const { rendu, pdf } = await searchParams;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);

  const loaded = await loadDownloadableDocument(id, session.userId);
  if (!loaded) {
    // Un brouillon pas encore payé : on renvoie vers le paiement plutôt que
    // d'annoncer à tort une suppression.
    const draft = await prisma.document.findFirst({
      where: { id, userId: session.userId, professionalAccountId: null, status: "DRAFT" },
      select: { id: true },
    });
    if (draft) redirect(`/${locale}/paiement/${draft.id}`);

    // Document expiré (ou déjà purgé) : un lien de téléchargement ancien doit
    // expliquer pourquoi il ne fonctionne plus, pas afficher une erreur 404.
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
          <ClockIcon className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold">{dict.retention.unavailableTitle}</h1>
        <p className="text-sm text-black/60 dark:text-white/60">{dict.retention.unavailableText}</p>
        <Link
          href={`/${locale}/tableau-de-bord`}
          className="mt-2 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25"
        >
          {dict.retention.backToDashboard}
        </Link>
      </div>
    );
  }

  const availableUntil = formatLongDate(expiresAt(loaded.document.paidAt ?? new Date()), locale as Locale);

  const documentView = (
    <div className="a4-print-root">
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
  );

  // Document Pro : il se consulte et se télécharge depuis l'espace Pro ;
  // cette page ne sert que de rendu pour la fabrication de son PDF.
  if (loaded.pro && rendu !== "pdf") redirect(`/fr/pro/documents/${loaded.document.id}`);

  // Page lue par le Chrome sans écran qui fabrique le PDF
  // (api/documents/[id]/pdf) : le document seul, en taille A4 réelle.
  if (rendu === "pdf") {
    return (
      <div className="bg-white">
        <CvFonts />
        <div className="mx-auto w-fit">{documentView}</div>
      </div>
    );
  }

  const title =
    loaded.kind === "CV" ? dict.download.titleCv : loaded.kind === "BEWERBUNGSBRIEF" ? dict.download.titleBewerbungsbrief : dict.download.titleCoverLetter;

  // Page volontairement simple (demande de l'utilisateur, 2026-09-29) : un
  // titre, un seul gros bouton qui télécharge un vrai fichier PDF, puis
  // l'aperçu réduit à la largeur de l'écran. Plus d'ouverture automatique
  // de la fenêtre d'impression.
  return (
    <div className="bg-[#efe6d8] pb-14 print:bg-white print:p-0 dark:bg-black">
      <CvFonts />
      <div className="print-hide mx-auto flex max-w-md flex-col items-center gap-3 px-5 pt-10 pb-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-white shadow-lg shadow-[#eb5757]/30">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="flex items-start gap-2 text-sm text-black/65 dark:text-white/65">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {dict.download.availableUntil.replace("{date}", availableUntil)}
        </p>
        <div className="mt-2 w-full">
          <DocumentDownload
            documentId={loaded.document.id}
            locale={locale}
            failed={pdf === "erreur"}
            labels={{
              button: dict.download.button,
              preparing: dict.download.preparing,
              done: dict.download.done,
              again: dict.download.again,
              error: dict.download.error,
              print: dict.download.print,
            }}
          />
        </div>
        <Link href={`/${locale}/tableau-de-bord`} className="mt-1 text-sm font-medium text-black/60 underline dark:text-white/60">
          {dict.download.back}
        </Link>
      </div>

      <div className="mx-auto max-w-xl px-4 print:max-w-none print:p-0">
        <p className="print-hide mb-3 text-center text-xs font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">{dict.download.previewLabel}</p>
        <div className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <DocumentPreviewFit>{documentView}</DocumentPreviewFit>
        </div>
        <p className="print-hide mx-auto mt-6 max-w-md text-center text-xs text-black/50 dark:text-white/50">{dict.payment.wordHint}</p>
      </div>
    </div>
  );
}
