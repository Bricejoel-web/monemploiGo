import "server-only";
import type { PaymentGateway } from "./types";

/**
 * Intégration Orange Money — Web Payment API.
 * Documentation officielle : https://developer.orange.com/apis/om-webpay
 *
 * Nécessite dans .env : ORANGE_MONEY_BASE_URL, ORANGE_MONEY_CLIENT_ID,
 * ORANGE_MONEY_CLIENT_SECRET, ORANGE_MONEY_MERCHANT_KEY.
 * Tant que ces variables sont vides, utiliser PAYMENT_MODE=mock (voir mock.ts).
 *
 * Note : contrairement à MTN (push USSD direct sur le téléphone), l'API Web
 * Payment d'Orange redirige le client vers une page de paiement hébergée par
 * Orange puis revient sur notre "return_url". `initiate` renvoie ce lien dans
 * `message` ; à l'appelant de rediriger l'utilisateur dessus.
 */

const baseUrl = process.env.ORANGE_MONEY_BASE_URL;
const clientId = process.env.ORANGE_MONEY_CLIENT_ID;
const clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
const merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Orange Money: échec d'authentification (${res.status})`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const orangeGateway: PaymentGateway = {
  async initiate({ amountFcfa, reference, description }) {
    if (!baseUrl || !clientId || !clientSecret || !merchantKey) {
      return { success: false, providerRef: "", status: "failed", message: "Orange Money non configuré." };
    }

    const accessToken = await getAccessToken();
    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${baseUrl}/webpayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_key: merchantKey,
        currency: "XAF",
        order_id: reference,
        amount: amountFcfa,
        return_url: `${appBaseUrl}/paiement/retour?ref=${reference}`,
        cancel_url: `${appBaseUrl}/paiement/annule?ref=${reference}`,
        notif_url: `${appBaseUrl}/api/paiement/webhook/orange`,
        lang: "fr",
        reference: description,
      }),
    });

    if (!res.ok) {
      return { success: false, providerRef: "", status: "failed", message: `Orange Money: requête refusée (${res.status})` };
    }

    const data = (await res.json()) as { pay_token: string; payment_url: string };
    return {
      success: true,
      providerRef: data.pay_token,
      status: "pending",
      message: data.payment_url,
    };
  },

  async checkStatus({ providerRef }) {
    if (!baseUrl || !clientId || !clientSecret) return { status: "failed" };

    const accessToken = await getAccessToken();
    const res = await fetch(`${baseUrl}/transactionstatus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: providerRef, amount: "", pay_token: providerRef }),
    });
    if (!res.ok) return { status: "pending" };

    const data = (await res.json()) as { status: string };
    if (data.status === "SUCCESS") return { status: "success" };
    if (data.status === "FAILED" || data.status === "EXPIRED") return { status: "failed" };
    return { status: "pending" };
  },
};
