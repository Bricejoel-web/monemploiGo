import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { loadOwnedPaidDocument } from "@/lib/documents/load-document";
import { expiresAt } from "@/lib/documents/retention";
import { formatLongDate } from "@/lib/format-date";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { CoverLetterRenderer } from "@/components/cv/CoverLetterRenderer";
import { BewerbungsbriefRenderer } from "@/components/cv/BewerbungsbriefRenderer";
import { PrintButton } from "@/components/cv/PrintButton";
import { ClockIcon } from "@/components/home/icons";

export default async function DocumentPreviewPage({ params }: PageProps<"/[locale]/document/[id]/apercu">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);
  const dict = await getDictionary(locale as Locale);

  const loaded = await loadOwnedPaidDocument(id, session.userId);
  if (!loaded) {
    // Un brouillon pas encore payé : on renvoie vers le paiement plutôt que
    // d'annoncer à tort une suppression.
    const draft = await prisma.document.findFirst({
      where: { id, userId: session.userId, status: "DRAFT" },
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

  return (
    <div className="overflow-x-auto bg-black/5 py-10 print:overflow-visible print:bg-white print:p-0 dark:bg-black">
      <PrintButton label={dict.payment.downloadPdf} />
      <div className="print-hide sticky left-0 mb-6 px-4">
        <p className="mx-auto flex max-w-xl items-start gap-2 rounded-lg border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/40 dark:text-sky-100">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {dict.retention.previewBanner.replace("{date}", availableUntil)}
        </p>
      </div>
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
