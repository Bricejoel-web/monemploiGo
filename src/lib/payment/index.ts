import "server-only";
import type { PaymentGateway, PaymentProviderId } from "./types";
import { mockGateway } from "./mock";
import { mtnGateway } from "./mtn";
import { orangeGateway } from "./orange";
import { cinetpayGateway } from "./cinetpay";
import { monetbilGateway } from "./monetbil";
import { notchpayGateway } from "./notchpay";

export * from "./types";
export { verifyMonetbilSignature } from "./monetbil";
export { verifyNotchPaySignature } from "./notchpay";

function isLiveMode() {
  return process.env.PAYMENT_MODE === "live";
}

const LIVE_GATEWAYS: Record<PaymentProviderId, PaymentGateway> = {
  MONETBIL: monetbilGateway,
  CINETPAY: cinetpayGateway,
  MTN_MOMO: mtnGateway,
  ORANGE_MONEY: orangeGateway,
  NOTCHPAY: notchpayGateway,
};

export function getGateway(provider: PaymentProviderId): PaymentGateway {
  if (!isLiveMode()) return mockGateway;
  return LIVE_GATEWAYS[provider];
}
