"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { submitReviewAction } from "@/lib/documents/review-actions";

type ReviewLabels = Dictionary["review"];

// "Plus tard" masque la demande sur cet appareil pendant 30 jours : assez
// pour ne pas importuner, sans renoncer définitivement à l'avis (le client
// n'en donne qu'un seul, voir le modèle Review).
const LATER_KEY = "monemploigo_review_later";
const LATER_MS = 30 * 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();
let laterFallback = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readLater(): boolean {
  if (laterFallback) return true;
  try {
    const at = Number(localStorage.getItem(LATER_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < LATER_MS;
  } catch {
    return false;
  }
}

function remindLater() {
  laterFallback = true;
  try {
    localStorage.setItem(LATER_KEY, String(Date.now()));
  } catch {
    // Sans stockage, la demande est masquée jusqu'au rechargement.
  }
  listeners.forEach((listener) => listener());
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 transition-transform group-hover:scale-110">
      <path
        d="m12 3 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8Z"
        strokeLinejoin="round"
        strokeWidth={1.6}
        className={filled ? "fill-amber-400 stroke-amber-500" : "fill-transparent stroke-black/25 dark:stroke-white/30"}
      />
    </svg>
  );
}

export function ReviewPrompt({
  documentId,
  labels,
  locale,
  subtitle,
}: {
  documentId: string;
  labels: ReviewLabels;
  locale: Locale;
  subtitle: string;
}) {
  const later = useSyncExternalStore(subscribe, readLater, () => false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <p role="status" className="rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        {labels.thanks}
      </p>
    );
  }
  if (later) return null;

  const shown = hovered || rating;

  const submit = () => {
    if (rating === 0) {
      setError(labels.errors.invalid);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitReviewAction({ documentId, rating, comment, locale });
        if (result.ok) setSent(true);
        else setError(labels.errors[result.error]);
      } catch {
        setError(labels.errors.unknown);
      }
    });
  };

  return (
    <section
      aria-labelledby="review-title"
      className="print-hide rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
    >
      <h2 id="review-title" className="text-base font-bold">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">{subtitle}</p>

      <fieldset className="mt-4">
        <legend className="sr-only">{labels.ratingLegend}</legend>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[#eb5757]"
                onMouseEnter={() => setHovered(n)}
              >
                <input
                  type="radio"
                  name="review-rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => {
                    setRating(n);
                    setError(null);
                  }}
                  className="sr-only"
                  aria-label={labels.starLabel.replace("{n}", String(n))}
                />
                <Star filled={n <= shown} />
              </label>
            ))}
          </div>
          <span aria-hidden="true" className="min-w-24 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {shown > 0 ? labels.levels[shown - 1] : ""}
          </span>
        </div>
      </fieldset>

      {rating > 0 && (
        <div className="mt-4">
          <label htmlFor="review-comment" className="text-sm font-medium">
            {rating <= 3 ? labels.commentLow : labels.commentHigh}{" "}
            <span className="font-normal text-black/50 dark:text-white/50">({labels.optional})</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder={labels.commentPlaceholder}
            className="input mt-1.5 min-h-20"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? labels.sending : labels.submit}
        </button>
        <button
          type="button"
          onClick={remindLater}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
        >
          {labels.later}
        </button>
      </div>
    </section>
  );
}
