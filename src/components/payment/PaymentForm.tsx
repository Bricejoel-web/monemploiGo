"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { initiatePaymentAction, checkPaymentStatusAction, abandonPaymentAction } from "@/lib/documents/payment-actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { ClockIcon, PhoneIcon, WarningIcon } from "@/components/home/icons";
import { formatLongDate } from "@/lib/format-date";
import { ReviewPrompt } from "@/components/review/ReviewPrompt";

type Status = "idle" | "pending" | "success" | "failed";

// Même délai que ABANDON_MIN_AGE_MS (src/lib/payment/settle.ts), qui reste
// la règle appliquée côté serveur.
const ABANDON_DELAY_MS = 2 * 60 * 1000;

export function PaymentForm({
  documentId,
  amountFcfa,
  dict,
  locale,
  initiallyPaid = false,
  expiresAtIso,
  askForReview,
  processingPaymentId,
  processingSinceIso,
  returnNotice,
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
  /** Début de ce paiement en cours (pour le délai avant « réessayer »). */
  processingSinceIso?: string;
  /** Issue du paiement précédent, transmise par la page de retour. */
  returnNotice?: "failed" | "notCompleted";
}) {
  const [status, setStatus] = useState<Status>(initiallyPaid ? "success" : processingPaymentId ? "pending" : "idle");
  const [message, setMessage] = useState<string | undefined>(processingPaymentId ? dict.payment.processing : undefined);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Paiement « en cours » que le client peut abandonner (voir abandonPaymentAction).
  const [processingId, setProcessingId] = useState(processingPaymentId);
  const [abandonNotice, setAbandonNotice] = useState<string | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const abandonAt = processingSinceIso ? new Date(processingSinceIso).getTime() + ABANDON_DELAY_MS : 0;
  const secondsBeforeAbandon = Math.max(0, Math.ceil((abandonAt - now) / 1000));

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // Compte à rebours avant de pouvoir abandonner le paiement en cours.
  useEffect(() => {
    if (!processingId || !abandonAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [processingId, abandonAt]);

  // Paiement en cours de confirmation à l'ouverture de la page : on suit son
  // issue (réussi → téléchargement, échoué → bouton Payer à nouveau).
  useEffect(() => {
    if (!processingId) return;
    const timer = setInterval(async () => {
      const result = await checkPaymentStatusAction(processingId);
      if (result.status === "success" || result.status === "failed") {
        setMessage(undefined);
        setStatus(result.status);
        clearInterval(timer);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [processingId]);

  const handleAbandon = () => {
    if (!processingId) return;
    startTransition(async () => {
      const result = await abandonPaymentAction(processingId);
      if (result.status === "success") {
        setStatus("success");
      } else if (result.status === "canceled") {
        setProcessingId(undefined);
        setMessage(undefined);
        setStatus("idle");
        setAbandonNotice(dict.payment.abandoned);
      } else {
        const minutes = Math.max(1, Math.ceil((result.waitSeconds ?? 60) / 60));
        setAbandonNotice(dict.payment.abandonWait.replace("{minutes}", String(minutes)));
      }
    });
  };

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
      {status === "pending" && processingId && (
        <div className="flex flex-col gap-2 rounded-md border border-black/10 bg-black/[0.03] p-3 text-sm dark:border-white/15 dark:bg-white/5">
          <p className="text-black/70 dark:text-white/70">{dict.payment.abandonQuestion}</p>
          <button
            type="button"
            disabled={pending || secondsBeforeAbandon > 0}
            onClick={handleAbandon}
            className="self-start rounded-full border border-black/20 px-4 py-2 text-sm font-semibold disabled:opacity-60 dark:border-white/25"
          >
            {secondsBeforeAbandon > 0
              ? dict.payment.abandonIn.replace("{seconds}", String(secondsBeforeAbandon))
              : pending
                ? dict.common.loading
                : dict.payment.abandon}
          </button>
          {abandonNotice && <p className="text-xs text-black/60 dark:text-white/60">{abandonNotice}</p>}
        </div>
      )}
      {status === "idle" && abandonNotice && (
        <p role="status" className="rounded-md border border-emerald-300/70 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          {abandonNotice}
        </p>
      )}
      {status === "failed" && <p className="text-sm text-red-600">{message ?? dict.payment.failed}</p>}

      {status === "idle" && returnNotice === "failed" && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-red-300/70 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {dict.payment.returnFailed}
        </p>
      )}
      {status === "idle" && returnNotice === "notCompleted" && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-black/15 bg-black/[0.03] p-3 text-sm text-black/75 dark:border-white/20 dark:bg-white/5 dark:text-white/75">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {dict.payment.returnNotCompleted}
        </p>
      )}

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
