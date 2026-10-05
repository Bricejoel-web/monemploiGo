"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { initiateProSubscriptionAction } from "@/lib/pro/billing-actions";
import { abandonPaymentAction, checkPaymentStatusAction } from "@/lib/documents/payment-actions";

// Même délai que ABANDON_MIN_AGE_MS (src/lib/payment/settle.ts), qui reste
// la règle appliquée côté serveur.
const ABANDON_DELAY_MS = 2 * 60 * 1000;

/**
 * Paiement d'une période Pro Starter : case de lecture du récapitulatif,
 * paiement Notch Pay, suivi d'un paiement en cours de confirmation (jamais
 * de second paiement pendant ce temps) et abandon sans double débit. Le
 * montant affiché n'est qu'une étiquette : le serveur fixe le vrai montant.
 */
export function ProSubscriptionPayment({
  amountLabel,
  processingPaymentId,
  processingSinceIso,
}: {
  amountLabel: string;
  processingPaymentId?: string;
  processingSinceIso?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState(processingPaymentId);
  const [processingSince, setProcessingSince] = useState(processingSinceIso);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | undefined>();
  const [now, setNow] = useState(() => Date.now());

  const abandonAt = processingSince ? new Date(processingSince).getTime() + ABANDON_DELAY_MS : 0;
  const secondsBeforeAbandon = Math.max(0, Math.ceil((abandonAt - now) / 1000));

  // Paiement en cours de confirmation : on suit son issue.
  useEffect(() => {
    if (!processingId) return;
    const poll = setInterval(async () => {
      const result = await checkPaymentStatusAction(processingId);
      if (result.status === "success") {
        clearInterval(poll);
        router.refresh();
      } else if (result.status === "failed") {
        clearInterval(poll);
        setProcessingId(undefined);
        setMessage({ tone: "error", text: "Le paiement n'a pas abouti. Aucun abonnement n'a été activé. Vous pouvez réessayer." });
      }
    }, 4000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [processingId, router]);

  const pay = (formData: FormData) => {
    startTransition(async () => {
      setMessage(undefined);
      const result = await initiateProSubscriptionAction(formData);
      if (result.status === "success") {
        router.refresh();
        return;
      }
      if (result.status === "pending") {
        if (result.redirectUrl) {
          // Notch Pay : choix de l'opérateur sur sa page, puis retour sur
          // /paiement/retour, qui vérifie le vrai statut.
          window.location.href = result.redirectUrl;
          return;
        }
        setProcessingId(result.paymentId);
        setProcessingSince(result.processing ? processingSince : new Date().toISOString());
        return;
      }
      setMessage({ tone: "error", text: result.message ?? "Le paiement n'a pas pu être lancé. Réessayez." });
    });
  };

  const abandon = () => {
    if (!processingId) return;
    startTransition(async () => {
      const result = await abandonPaymentAction(processingId);
      if (result.status === "success") {
        router.refresh();
      } else if (result.status === "canceled") {
        setProcessingId(undefined);
        setMessage({ tone: "info", text: "Le paiement précédent est annulé : rien n'a été débité. Vous pouvez payer à nouveau." });
      } else {
        const minutes = Math.max(1, Math.ceil((result.waitSeconds ?? 60) / 60));
        setMessage({ tone: "info", text: `Votre opérateur n'a pas encore confirmé l'annulation. Pour éviter tout double débit, réessayez dans ${minutes} min.` });
      }
    });
  };

  if (processingId) {
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-black/10 bg-black/[0.03] p-4 text-sm dark:border-white/15 dark:bg-white/5">
        <p className="font-medium text-amber-800 dark:text-amber-300">
          Votre paiement est en cours de confirmation par votre opérateur Mobile Money. Cette page se met à jour automatiquement : inutile de payer à nouveau.
        </p>
        <p className="text-black/70 dark:text-white/70">Vous avez annulé sur votre téléphone, ou vous n&apos;avez reçu aucune demande de validation ?</p>
        <button
          type="button"
          onClick={abandon}
          disabled={pending || secondsBeforeAbandon > 0}
          className="self-start rounded-full border border-black/20 px-4 py-2 text-sm font-semibold disabled:opacity-60 dark:border-white/25"
        >
          {secondsBeforeAbandon > 0 ? `Disponible dans ${secondsBeforeAbandon} s` : pending ? "Chargement…" : "Annuler ce paiement et réessayer"}
        </button>
        {message && <p className="text-xs text-black/60 dark:text-white/60">{message.text}</p>}
      </div>
    );
  }

  return (
    <form action={pay} className="mt-4 flex flex-col gap-3">
      <p className="rounded-md border border-sky-300/60 bg-sky-50 p-3 text-xs text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100">
        Pour le moment, le paiement fonctionne uniquement avec un compte Mobile Money du Cameroun (MTN, Orange). Sur la page de paiement, gardez le pays « Cameroon ».
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="recap" required className="mt-1 h-4 w-4 shrink-0" />
        <span>J&apos;ai lu le récapitulatif et la règle de remboursement ci-dessus.</span>
      </label>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={message.tone === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-emerald-800 dark:text-emerald-300"}
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 disabled:opacity-60"
      >
        {pending ? "Chargement…" : `Payer ${amountLabel} avec Mobile Money`}
      </button>
    </form>
  );
}
