import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { PRICE_FCFA, COVER_LETTER_PRICE_FCFA, BEWERBUNGSBRIEF_PRICE_FCFA } from "@/lib/cv/catalog";
import { PaymentForm } from "@/components/payment/PaymentForm";
import { expiresAt, retentionCutoff } from "@/lib/documents/retention";

export default async function PaymentPage({ params }: PageProps<"/[locale]/paiement/[documentId]">) {
  const { locale, documentId } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: session.userId },
  });
  if (!document) notFound();
  if (document.status === "PAID" && document.paidAt && document.paidAt < retentionCutoff()) {
    redirect(`/${locale}/document/${document.id}/apercu`);
  }

  const dict = await getDictionary(locale as Locale);
  const amount =
    document.type === "COVER_LETTER"
      ? COVER_LETTER_PRICE_FCFA
      : document.type === "BEWERBUNGSBRIEF"
        ? BEWERBUNGSBRIEF_PRICE_FCFA
        : PRICE_FCFA[document.category ?? "STANDARD"];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-14">
      <div>
        <h1 className="text-2xl font-bold">{dict.payment.title}</h1>
        <p className="text-sm text-black/60 dark:text-white/60">{document.title}</p>
      </div>

      <PaymentForm
        documentId={document.id}
        amountFcfa={amount}
        dict={dict}
        locale={locale as Locale}
        initiallyPaid={document.status === "PAID"}
        // Si le paiement vient d'être confirmé sur cette page, la date de
        // paiement enregistrée est "maintenant" : même échéance au jour près.
        expiresAtIso={expiresAt(document.paidAt ?? new Date()).toISOString()}
      />
    </div>
  );
}
