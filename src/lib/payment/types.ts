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
  /**
   * "pending" : le client n'a pas encore validé (ou a quitté la page de
   * paiement) ; "processing" : il a validé et l'opérateur confirme (USSD) —
   * un nouveau paiement risquerait alors de le faire payer deux fois.
   */
  status: "pending" | "processing" | "success" | "failed";
  /** Montant et devise réellement payés, tels que la passerelle les
   * rapporte : comparés à ce que nous avions demandé avant de débloquer. */
  amount?: number;
  currency?: string;
}

export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  checkStatus(input: CheckPaymentStatusInput): Promise<CheckPaymentStatusResult>;
}
