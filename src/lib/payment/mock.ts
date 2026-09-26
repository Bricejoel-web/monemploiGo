import "server-only";
import type { PaymentGateway } from "./types";

/**
 * Passerelle de paiement simulée, utilisée quand PAYMENT_MODE=mock (par défaut).
 * Elle permet de tester tout le parcours (commande → paiement → déblocage du
 * téléchargement) sans identifiants MTN/Orange réels. À remplacer par les
 * vraies intégrations (voir mtn.ts / orange.ts) dès que les accès marchands
 * sont disponibles, en changeant simplement PAYMENT_MODE=live dans .env.
 */
export const mockGateway: PaymentGateway = {
  async initiate({ reference }) {
    return {
      success: true,
      providerRef: `MOCK-${reference}`,
      status: "success",
      message: "Paiement simulé validé instantanément (mode démo).",
    };
  },
  async checkStatus() {
    return { status: "success" };
  },
};
