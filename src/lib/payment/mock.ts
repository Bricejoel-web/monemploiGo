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
  async checkStatus({ providerRef }) {
    // Pour les tests du parcours « annuler ce paiement et réessayer » : un
    // paiement resté en cours chez l'opérateur, ou refusé par lui.
    if (providerRef.startsWith("MOCK-PROCESSING")) return { status: "processing" };
    if (providerRef.startsWith("MOCK-FAILED")) return { status: "failed" };
    // Confirmation avec le montant payé (« MOCK-AMOUNT-5000-… ») : pour tester
    // le contrôle du montant de settlePayment, exact ou non.
    if (providerRef.startsWith("MOCK-AMOUNT-")) return { status: "success", amount: Number(providerRef.split("-")[2]), currency: "XAF" };
    return { status: "success" };
  },
};
