import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentGateway } from "./types";

/**
 * Intégration Notch Pay — API v2.1.0.
 * Documentation officielle consultée directement (developer.notchpay.co) :
 *   - Authentification : get-started/authentication
 *   - Initialisation :   api-reference/initialize-a-payment
 *   - Vérification :     api-reference/retrieve-a-payment
 *   - Webhooks :         get-started/webhooks (index + verify)
 *
 * Nécessite dans .env : NOTCHPAY_PUBLIC_KEY, NOTCHPAY_WEBHOOK_HASH,
 * APP_BASE_URL. Tant que ces variables sont vides, utiliser
 * PAYMENT_MODE=mock (voir mock.ts). Utiliser les valeurs commençant par
 * "test_" pendant les essais en sandbox — jamais mélanger avec des clés
 * de production.
 *
 * Point d'attention documenté par Notch Pay eux-mêmes : "Toujours utiliser
 * les clés de test pour le développement, afin d'éviter des débits
 * accidentels." Les clés restent strictement côté serveur (ce fichier
 * démarre par `import "server-only"`), jamais transmises au navigateur.
 */

const API_BASE_URL = "https://api.notchpay.co";

// D'après la documentation officielle (api-reference/authentication) : le
// header `Authorization` attend la clé PUBLIQUE (ApiKeyAuth) — c'est ce que
// POST /payments et GET /payments/{reference} exigent tous les deux. Le
// header `X-Grant` (clé PRIVÉE/secrète) ne sert qu'aux opérations dites
// "sensibles" (solde, transferts, bénéficiaires, gestion des webhooks via
// l'API) — aucune de ces opérations n'est utilisée ici, donc
// NOTCHPAY_SECRET_KEY n'est pas consommée par ce fichier pour l'instant.
const publicKey = process.env.NOTCHPAY_PUBLIC_KEY;
const webhookHash = process.env.NOTCHPAY_WEBHOOK_HASH;

// Schéma réel observé empiriquement (vérifié par appel direct à l'API
// sandbox le 2026-09-26 — la documentation officielle ne le déclare pas
// clairement) : `reference` est l'identifiant INTERNE Notch Pay
// (`trx.test_...`, à utiliser pour GET /payments/{reference}) ;
// `merchant_reference`/`trxref` sont NOTRE référence telle que transmise
// à l'initialisation.
interface NotchPayTransaction {
  reference?: string;
  merchant_reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

interface NotchPayInitResponse {
  status: string;
  message: string;
  code: number;
  transaction?: NotchPayTransaction;
  authorization_url?: string;
}

interface NotchPayRetrieveResponse {
  status: string;
  code: number;
  message?: string;
  transaction?: NotchPayTransaction;
}

export const notchpayGateway: PaymentGateway = {
  async initiate({ amountFcfa, reference, description, email }) {
    if (!publicKey) {
      return { success: false, providerRef: "", status: "failed", message: "Notch Pay non configuré." };
    }
    if (!email) {
      // L'API Notch Pay exige au moins un identifiant client (email,
      // téléphone ou objet "customer") — voir initiatePaymentAction, qui
      // récupère l'e-mail de l'utilisateur avant d'appeler ce gateway.
      return { success: false, providerRef: "", status: "failed", message: "E-mail du client requis pour Notch Pay." };
    }

    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountFcfa,
        currency: "XAF",
        // Seuls les canaux du Cameroun sont activés sur le compte marchand :
        // tout autre pays est refusé au traitement ("The selected channel is
        // invalid", reproduit le 2026-09-28 pour CI, SN, en XAF comme en
        // XOF). On le déclare donc ici. ATTENTION : la page hébergée Notch
        // Pay (sandbox) ignore ce paramètre et propose quand même tous les
        // pays — d'où l'avertissement affiché avant le paiement
        // (payment.countryNotice). À retirer dès que Notch Pay active
        // d'autres pays sur le compte.
        locked_country: "CM",
        reference,
        email,
        description,
        callback: `${appBaseUrl}/paiement/retour?ref=${reference}`,
      }),
    });

    const data = (await res.json().catch(() => null)) as NotchPayInitResponse | null;

    if (!res.ok || !data?.authorization_url) {
      return { success: false, providerRef: "", status: "failed", message: data?.message ?? "Échec de l'initialisation du paiement Notch Pay." };
    }

    return {
      success: true,
      // IMPORTANT : GET /payments/{reference} exige la référence INTERNE
      // Notch Pay (`transaction.reference`, ex. "trx.test_..."), pas la
      // nôtre — vérifié empiriquement (notre référence renvoie 404).
      // Notre propre référence reste de toute façon identifiable via
      // `merchant_reference` dans la réponse Notch Pay et dans le webhook.
      providerRef: data.transaction?.reference ?? reference,
      status: "pending",
      redirectUrl: data.authorization_url,
      message: description,
    };
  },

  // Vérification server-to-server réelle (GET /payments/{reference}) —
  // utilisée par la page de retour pour ne JAMAIS déclarer un paiement
  // réussi sur la seule base du retour du navigateur : on interroge
  // toujours Notch Pay directement avant de mettre à jour la base.
  async checkStatus({ providerRef }) {
    if (!publicKey) return { status: "pending" };

    const res = await fetch(`${API_BASE_URL}/payments/${providerRef}`, {
      headers: { Authorization: publicKey },
      // Appelé pendant l'affichage de pages (tableau de bord, paiement) :
      // une API lente ne doit jamais bloquer la page.
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (!res?.ok) return { status: "pending" };

    const data = (await res.json().catch(() => null)) as NotchPayRetrieveResponse | null;
    const txStatus = data?.transaction?.status;
    const paid = { amount: data?.transaction?.amount, currency: data?.transaction?.currency };

    // Statuts documentés par Notch Pay : pending, processing, complete
    // (parfois "completed"), failed, canceled (parfois "cancelled", vu en
    // réel), expired, refunded.
    if (txStatus === "complete" || txStatus === "completed") return { status: "success", ...paid };
    if (txStatus === "processing") return { status: "processing" };
    if (txStatus === "failed" || txStatus === "canceled" || txStatus === "cancelled" || txStatus === "expired" || txStatus === "refunded") {
      return { status: "failed" };
    }
    return { status: "pending" };
  },
};

/**
 * Vérifie la signature d'une notification Notch Pay : HMAC-SHA256 calculé
 * sur le corps BRUT (chaîne exacte reçue, avant tout `JSON.parse`) avec la
 * "webhook hash key", comparée en temps constant à l'en-tête
 * `x-notch-signature` pour éviter les attaques par mesure de timing.
 */
export function verifyNotchPaySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!webhookHash || !signatureHeader) return false;

  const expected = createHmac("sha256", webhookHash).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
