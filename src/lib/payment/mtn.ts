import "server-only";
import type { PaymentGateway } from "./types";

/**
 * Intégration MTN Mobile Money — API "Collections" (Request to Pay).
 * Documentation officielle : https://momodeveloper.mtn.com
 *
 * Nécessite dans .env : MTN_MOMO_BASE_URL, MTN_MOMO_SUBSCRIPTION_KEY,
 * MTN_MOMO_API_USER, MTN_MOMO_API_KEY, MTN_MOMO_TARGET_ENVIRONMENT.
 * Tant que ces variables sont vides, utiliser PAYMENT_MODE=mock (voir mock.ts).
 */

const baseUrl = process.env.MTN_MOMO_BASE_URL;
const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
const apiUser = process.env.MTN_MOMO_API_USER;
const apiKey = process.env.MTN_MOMO_API_KEY;
const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT ?? "sandbox";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const res = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey ?? "",
    },
  });
  if (!res.ok) throw new Error(`MTN MoMo: échec d'authentification (${res.status})`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const mtnGateway: PaymentGateway = {
  async initiate({ phoneNumber, amountFcfa, reference, description }) {
    if (!baseUrl || !subscriptionKey || !apiUser || !apiKey) {
      return { success: false, providerRef: "", status: "failed", message: "MTN MoMo non configuré." };
    }
    if (!phoneNumber) {
      return { success: false, providerRef: "", status: "failed", message: "Numéro de téléphone requis." };
    }

    const accessToken = await getAccessToken();
    const referenceId = crypto.randomUUID();

    const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": targetEnvironment,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(amountFcfa),
        currency: "XAF",
        externalId: reference,
        payer: { partyIdType: "MSISDN", partyId: phoneNumber.replace(/\D/g, "") },
        payerMessage: description,
        payeeNote: description,
      }),
    });

    if (res.status !== 202) {
      return { success: false, providerRef: referenceId, status: "failed", message: `MTN MoMo: requête refusée (${res.status})` };
    }

    return {
      success: true,
      providerRef: referenceId,
      status: "pending",
      message: "Validez le paiement via le code USSD envoyé sur votre téléphone.",
    };
  },

  async checkStatus({ providerRef }) {
    if (!baseUrl || !subscriptionKey) return { status: "failed" };

    const accessToken = await getAccessToken();
    const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Target-Environment": targetEnvironment,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });
    if (!res.ok) return { status: "pending" };

    const data = (await res.json()) as { status: "PENDING" | "SUCCESSFUL" | "FAILED" };
    if (data.status === "SUCCESSFUL") return { status: "success" };
    if (data.status === "FAILED") return { status: "failed" };
    return { status: "pending" };
  },
};
