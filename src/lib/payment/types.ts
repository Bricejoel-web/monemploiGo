export type PaymentProviderId = "MONETBIL" | "CINETPAY" | "MTN_MOMO" | "ORANGE_MONEY" | "NOTCHPAY";

export interface InitiatePaymentInput {
  provider: PaymentProviderId;
  /** Optionnel pour CinetPay/Monetbil/Notch Pay : le client choisit son opérateur sur la page hébergée. */
  phoneNumber?: string;
  amountFcfa: number;
  reference: string;
  description: string;
  /** Utilisé par Monetbil (champ "user") : renvoyé tel quel dans la notification,
   * ce qui permet au webhook de vérifier que le paiement concerne bien le même
   * utilisateur que celui qui l'a initié, plutôt que de faire confiance à la
   * seule référence de paiement. */
  userId?: string;
  /** Utilisé par Notch Pay : leur API exige au moins un identifiant client
   * (email, téléphone ou objet "customer") à l'initialisation. */
  email?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  providerRef: string;
  /** "pending" : le client doit terminer le paiement (USSD, ou page CinetPay) */
  status: "pending" | "success" | "failed";
  message?: string;
  /** Présent pour CinetPay : URL de la page de paiement hébergée vers laquelle rediriger le client. */
  redirectUrl?: string;
}

export interface CheckPaymentStatusInput {
  provider: PaymentProviderId;
  providerRef: string;
}

export interface CheckPaymentStatusResult {
  status: "pending" | "success" | "failed";
}

export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  checkStatus(input: CheckPaymentStatusInput): Promise<CheckPaymentStatusResult>;
}
