"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { initiatePaymentAction, checkPaymentStatusAction } from "@/lib/documents/payment-actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { ClockIcon, PhoneIcon } from "@/components/home/icons";
import { formatLongDate } from "@/lib/format-date";
import { ReviewPrompt } from "@/components/review/ReviewPrompt";

type Status = "idle" | "pending" | "success" | "failed";

export function PaymentForm({
  documentId,
  amountFcfa,
  dict,
  locale,
  initiallyPaid = false,
  expiresAtIso,
  askForReview,
  processingPaymentId,
}: {
  documentId: string;
  amountFcfa: number;
  dict: Dictionary;
  locale: Locale;
  initiallyPaid?: boolean;
  expiresAtIso: string;
  /** Faux si le client a déjà donné son avis (un seul par client). */
  askForReview: boolean;
  /** Paiement déjà validé par le client et en cours de confirmation chez
   * l'opérateur : on attend son issue au lieu de proposer de repayer. */
  processingPaymentId?: string;
}) {
  const [status, setStatus] = useState<Status>(initiallyPaid ? "success" : processingPaymentId ? "pending" : "idle");
  const [message, setMessage] = useState<string | undefined>(processingPaymentId ? dict.payment.processing : undefined);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // Paiement en cours de confirmation à l'ouverture de la page : on suit son
  // issue (réussi → téléchargement, échoué → bouton Payer à nouveau).
  useEffect(() => {
    if (!processingPaymentId) return;
    const timer = setInterval(async () => {
      const result = await checkPaymentStatusAction(processingPaymentId);
      if (result.status === "success" || result.status === "failed") {
        setMessage(undefined);
        setStatus(result.status);
        clearInterval(timer);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [processingPaymentId]);

  const pollStatus = (id: string) => {
    pollRef.current = setInterval(() => {
      startTransition(async () => {
        const result = await checkPaymentStatusAction(id);
        if (result.status === "success" || result.status === "failed") {
          setStatus(result.status);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      });
    }, 4000);
  };

  const handlePay = () => {
    startTransition(async () => {
      const result = await initiatePaymentAction(documentId);
      setMessage(result.processing ? dict.payment.processing : result.message);
      if (result.status === "success") {
        setStatus("success");
      } else if (result.status === "pending") {
        if (result.redirectUrl) {
          // Notch Pay : le client termine le paiement (choix MTN/Orange/etc.)
          // sur sa page hébergée, puis revient sur /paiement/retour.
          window.location.href = result.redirectUrl;
          return;
        }
        setStatus("pending");
        if (result.paymentId) pollStatus(result.paymentId);
      } else {
        setStatus("failed");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-6 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
        <p>{dict.payment.success}</p>
        <div className="flex gap-3">
          <Link href={`/${locale}/document/${documentId}/apercu`} target="_blank" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
            {dict.payment.downloadPdf}
          </Link>
        </div>
        <p className="flex items-start gap-2 rounded-md bg-white/70 p-3 text-sm font-medium dark:bg-black/20">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {dict.retention.afterPayment.replace("{date}", formatLongDate(expiresAtIso, locale))}
        </p>
        <p className="text-xs text-green-800/80 dark:text-green-300/70">{dict.payment.wordHint}</p>
      </div>
      {askForReview && (
        <ReviewPrompt documentId={documentId} labels={dict.review} locale={locale} subtitle={dict.review.subtitle} />
      )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        {dict.payment.amount}: <strong>{amountFcfa} FCFA</strong>
      </p>

      {status === "pending" && <p className="text-sm text-amber-700 dark:text-amber-400">{message ?? dict.payment.pendingUssd}</p>}
      {status === "failed" && <p className="text-sm text-red-600">{message ?? dict.payment.failed}</p>}

      <p className="flex items-start gap-2 rounded-md border border-sky-300/60 bg-sky-50 p-3 text-xs text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100">
        <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {dict.payment.countryNotice}
      </p>

      <p className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
        <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {dict.retention.beforePayment}
      </p>

      <button
        type="button"
        disabled={pending || status === "pending"}
        onClick={handlePay}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {dict.payment.pay}
      </button>

      <p className="text-xs text-black/50 dark:text-white/50">{dict.payment.viaMonetbil}</p>
      <p className="text-xs text-black/50 dark:text-white/50">
        {dict.payment.termsPrefix}{" "}
        <Link href={`/${locale}/conditions-utilisation`} target="_blank" className="font-medium underline hover:text-foreground">
          {dict.footer.termsOfUse}
        </Link>
        .
      </p>
    </div>
  );
}
