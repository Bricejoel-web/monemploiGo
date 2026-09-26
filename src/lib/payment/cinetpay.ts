import "server-only";
import type { PaymentGateway } from "./types";

/**
 * Intégration CinetPay — API Checkout v2.
 * Documentation officielle : https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
 *
 * Choisi car il évite d'avoir à négocier un accès direct (payant, avec
 * caution) auprès de MTN et Orange séparément : CinetPay a déjà ces accords
 * et prend une commission par transaction réussie seulement (pas de frais
 * fixe). Le client choisit MTN Mobile Money / Orange Money / carte sur la
 * page de paiement hébergée par CinetPay elle-même — notre interface n'a
 * donc plus besoin de demander le numéro de téléphone à l'avance.
 *
 * Nécessite dans .env : CINETPAY_API_KEY, CINETPAY_SITE_ID, APP_BASE_URL.
 * Tant que ces variables sont vides, utiliser PAYMENT_MODE=mock (voir mock.ts).
 */

const BASE_URL = "https://api-checkout.cinetpay.com/v2";

const apiKey = process.env.CINETPAY_API_KEY;
const siteId = process.env.CINETPAY_SITE_ID;

interface CinetPayInitResponse {
  code: string;
  message: string;
  description?: string;
  data?: { payment_token: string; payment_url: string };
}

interface CinetPayCheckResponse {
  code: string;
  message: string;
  data?: {
    status: "ACCEPTED" | "REFUSED" | "CANCELLED" | "PENDING" | "WAITING_CUSTOMER_PAYMENT_CONFIRMATION" | string;
    payment_method?: string;
    amount?: string;
    currency?: string;
  };
}

export const cinetpayGateway: PaymentGateway = {
  async initiate({ amountFcfa, reference, description }) {
    if (!apiKey || !siteId) {
      return { success: false, providerRef: "", status: "failed", message: "CinetPay non configuré." };
    }

    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${BASE_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: reference,
        amount: amountFcfa,
        currency: "XAF",
        description,
        notify_url: `${appBaseUrl}/api/paiement/webhook/cinetpay`,
        return_url: `${appBaseUrl}/paiement/retour?ref=${reference}`,
        channels: "ALL",
        lang: "fr",
      }),
    });

    const data = (await res.json()) as CinetPayInitResponse;

    if (!res.ok || data.code !== "201" || !data.data) {
      return { success: false, providerRef: "", status: "failed", message: data.description ?? data.message ?? "Échec de l'initialisation du paiement." };
    }

    return {
      success: true,
      providerRef: reference,
      status: "pending",
      redirectUrl: data.data.payment_url,
      message: "Redirection vers la page de paiement CinetPay…",
    };
  },

  async checkStatus({ providerRef }) {
    if (!apiKey || !siteId) return { status: "failed" };

    const res = await fetch(`${BASE_URL}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: providerRef }),
    });

    if (!res.ok) return { status: "pending" };

    const data = (await res.json()) as CinetPayCheckResponse;
    const status = data.data?.status;

    if (status === "ACCEPTED") return { status: "success" };
    if (status === "REFUSED" || status === "CANCELLED") return { status: "failed" };
    return { status: "pending" };
  },
};
