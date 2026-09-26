import "server-only";
import { createHash } from "crypto";
import type { PaymentGateway } from "./types";

/**
 * Intégration Monetbil — Widget API v2.1.
 * Documentation officielle (fournie par l'utilisateur) :
 * https://www.monetbil.com/docs/monetbil-payment-widget-v2.1-en.pdf
 * https://www.monetbil.com/docs/monetbil-payment-notification-fr.pdf
 *
 * Nécessite dans .env : MONETBIL_SERVICE_KEY, MONETBIL_SERVICE_SECRET,
 * APP_BASE_URL. Tant que ces variables sont vides, utiliser
 * PAYMENT_MODE=mock (voir mock.ts).
 *
 * Particularité par rapport à CinetPay : l'API Widget v2.1 ne documente
 * aucun endpoint de vérification de statut à la demande — la seule source
 * de vérité côté serveur est la notification asynchrone (`notify_url`),
 * signée avec le "Service secret". `checkStatus()` renvoie donc toujours
 * "pending" ici (rien à interroger) ; c'est `verifyNotification()`,
 * appelée depuis la route webhook, qui fait le travail réel de
 * vérification. Le flux existant (le formulaire de paiement sonde
 * `checkPaymentStatusAction`, qui relit d'abord le statut déjà en base
 * avant d'appeler le gateway) fonctionne donc sans changement : dès que le
 * webhook a mis à jour la base, le sondage suivant voit le nouveau statut
 * sans jamais avoir besoin d'interroger Monetbil une seconde fois.
 */

const WIDGET_BASE_URL = "https://api.monetbil.com/widget/v2.1";

const serviceKey = process.env.MONETBIL_SERVICE_KEY;
const serviceSecret = process.env.MONETBIL_SERVICE_SECRET;

interface MonetbilInitResponse {
  success: boolean;
  payment_url?: string;
  message?: string;
}

export const monetbilGateway: PaymentGateway = {
  async initiate({ amountFcfa, reference, description, userId }) {
    if (!serviceKey || !serviceSecret) {
      return { success: false, providerRef: "", status: "failed", message: "Monetbil non configuré." };
    }

    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

    const body = new URLSearchParams({
      amount: String(amountFcfa),
      currency: "XAF",
      country: "CM",
      locale: "fr",
      // `payment_ref` doit être unique côté Monetbil (une réutilisation
      // interrompt la transaction, d'après leur documentation) : on y met
      // notre propre identifiant de paiement, qui n'est jamais réutilisé.
      payment_ref: reference,
      item_ref: reference,
      notify_url: `${appBaseUrl}/api/paiement/webhook/monetbil`,
      return_url: `${appBaseUrl}/paiement/retour?ref=${reference}`,
      ...(userId ? { user: userId } : {}),
    });

    const res = await fetch(`${WIDGET_BASE_URL}/${serviceKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json().catch(() => null)) as MonetbilInitResponse | null;

    if (!res.ok || !data?.success || !data.payment_url) {
      return { success: false, providerRef: "", status: "failed", message: data?.message ?? "Échec de l'initialisation du paiement Monetbil." };
    }

    return {
      success: true,
      // Monetbil ne renvoie son propre transaction_id que dans la
      // notification, pas à l'initialisation : on garde donc notre propre
      // référence ici, mise à jour avec le vrai transaction_id Monetbil
      // dès que la notification arrive (voir la route webhook).
      providerRef: reference,
      status: "pending",
      redirectUrl: data.payment_url,
      message: description,
    };
  },

  // Voir le commentaire en tête de fichier : Monetbil n'expose pas
  // d'endpoint de vérification de statut à la demande dans la documentation
  // fournie. Toujours "pending" ici — la vraie mise à jour vient du webhook.
  async checkStatus() {
    return { status: "pending" };
  },
};

/**
 * Vérifie la signature d'une notification Monetbil, selon l'algorithme
 * documenté : `md5(service_secret + implode('', ksort(params)))`, calculé
 * sur tous les champs REÇUS sauf `sign` lui-même, triés par nom de
 * paramètre puis concaténés par valeur (sans séparateur).
 */
export function verifyMonetbilSignature(params: Record<string, string>): boolean {
  if (!serviceSecret) return false;
  const { sign, ...rest } = params;
  if (!sign) return false;

  const sortedValues = Object.keys(rest)
    .sort()
    .map((key) => rest[key])
    .join("");

  const expected = createHash("md5").update(serviceSecret + sortedValues).digest("hex");
  return expected === sign;
}
