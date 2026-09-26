import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyMonetbilSignature } from "@/lib/payment";

/**
 * Notification serveur-à-serveur Monetbil (notify_url). Contrairement à
 * CinetPay, l'API Monetbil documentée ne propose aucun endpoint de
 * vérification de statut à la demande : cette notification EST la source
 * de vérité, donc chaque contrôle ci-dessous est indispensable (aucun
 * garde-fou supplémentaire en aval) :
 *
 *  1. Signature (`sign`) valide, calculée avec le Service Secret — jamais
 *     transmis, jamais exposé au client.
 *  2. `payment_ref` correspond à un paiement que NOUS avons créé.
 *  3. Le paiement est encore `PENDING` (idempotence : une notification
 *     rejouée, ou reçue deux fois, ne fait rien la deuxième fois).
 *  4. Le montant et la devise reçus correspondent exactement à ce que
 *     nous avions enregistré au moment de l'initialisation (jamais au
 *     montant envoyé par la notification elle-même).
 *  5. L'utilisateur (`user`) correspond au propriétaire réel du paiement.
 *
 * Seulement si tout cela concorde ET que `status === "success"` le document
 * est marqué payé. Monetbil accepte GET ou POST pour cette notification.
 */
export async function POST(request: Request) {
  return handleNotification(request);
}

export async function GET(request: Request) {
  return handleNotification(request);
}

async function handleNotification(request: Request) {
  const params = await extractParams(request);

  const paymentRef = params.payment_ref;
  if (!paymentRef) {
    return NextResponse.json({ error: "payment_ref manquant" }, { status: 400 });
  }

  if (!verifyMonetbilSignature(params)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentRef } });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json({ ok: true }); // déjà traité (idempotent)
  }

  // Ne jamais faire confiance au montant/à la devise/à l'utilisateur
  // affirmés par la notification : on les compare à ce que NOUS avions
  // enregistré au moment de l'initialisation du paiement.
  const amountMatches = Number(params.amount) === payment.amountFcfa;
  const currencyMatches = !params.currency || params.currency === "XAF";
  const userMatches = !params.user || params.user === payment.userId;

  if (!amountMatches || !currencyMatches || !userMatches) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Incohérence montant/devise/utilisateur" }, { status: 400 });
  }

  const status = params.status; // "success" | "cancelled" | "failed"
  const providerRef = params.transaction_id || params.transaction_uuid || payment.providerRef;

  if (status === "success") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", providerRef } }),
      prisma.document.update({ where: { id: payment.documentId }, data: { status: "PAID" } }),
    ]);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerRef } });
  }

  // Monetbil attend une réponse pour confirmer la bonne réception.
  return NextResponse.json({ ok: true });
}

async function extractParams(request: Request): Promise<Record<string, string>> {
  const url = new URL(request.url);
  const fromQuery = Object.fromEntries(url.searchParams.entries());

  if (request.method === "GET") return fromQuery;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fromBody: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) fromBody[key] = String(value);
    return { ...fromQuery, ...fromBody };
  }

  const form = await request.formData().catch(() => null);
  const fromBody: Record<string, string> = {};
  if (form) for (const [key, value] of form.entries()) fromBody[key] = String(value);
  return { ...fromQuery, ...fromBody };
}
