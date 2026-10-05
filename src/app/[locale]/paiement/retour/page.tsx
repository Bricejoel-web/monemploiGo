import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getGateway } from "@/lib/payment";
import { settlePayment } from "@/lib/payment/settle";

// Page de retour après paiement (callback Notch Pay). La passerelle redirige
// ici que le paiement ait réussi ou non ; on vérifie le vrai statut auprès
// d'elle (jamais via les paramètres d'URL, qui ne sont pas fiables) avant de
// renvoyer l'utilisateur vers la page du document concerné.
export default async function PaymentReturnPage({
  params,
  searchParams,
}: PageProps<"/[locale]/paiement/retour">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await requireSession(locale);

  const { ref } = await searchParams;
  const paymentId = typeof ref === "string" ? ref : undefined;
  if (!paymentId) redirect(`/${locale}/tableau-de-bord`);

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: session.userId } });
  if (!payment) redirect(`/${locale}/tableau-de-bord`);

  let stillPendingAtNotchPay = false;
  if (payment.status === "PENDING" && payment.providerRef) {
    const gateway = getGateway(payment.provider);
    const result = await gateway.checkStatus({ provider: payment.provider, providerRef: payment.providerRef });
    await settlePayment(payment, result);
    // "processing" : la page de paiement affichera elle-même la
    // confirmation en cours ; "pending" : le client est revenu sans valider.
    stillPendingAtNotchPay = result.status === "pending";
  }

  // Sans ce retour, un client dont le paiement avait échoué revenait sur la
  // page de paiement sans aucune explication.
  const { status } = (await prisma.payment.findUnique({ where: { id: payment.id }, select: { status: true } }))!;
  const notice = status === "FAILED" ? "?paiement=echec" : status === "PENDING" && stillPendingAtNotchPay ? "?paiement=non-finalise" : "";
  // Abonnement Pro : retour sur la page « Mon abonnement » (français seul).
  if (payment.kind === "PRO_SUBSCRIPTION") {
    redirect(`/fr/pro/abonnement${status === "SUCCESS" ? "?paiement=confirme" : notice}`);
  }
  if (!payment.documentId) redirect(`/${locale}/tableau-de-bord`);
  redirect(`/${locale}/paiement/${payment.documentId}${notice}`);
}
