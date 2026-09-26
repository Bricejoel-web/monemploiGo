import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyNotchPaySignature } from "@/lib/payment";

/**
 * Notification serveur-à-serveur Notch Pay. D'après leur documentation
 * officielle (developer.notchpay.co, get-started/webhooks) :
 *
 *  1. Toujours POST, JSON.
 *  2. Signature HMAC-SHA256 dans l'en-tête `x-notch-signature`, calculée sur
 *     le corps BRUT (jamais le JSON re-sérialisé) avec la "webhook hash
 *     key" — jamais la clé secrète d'API. Comparaison en temps constant
 *     (recommandation explicite de Notch Pay).
 *  3. Répondre vite (contrainte documentée : 5 secondes) — aucun appel
 *     réseau synchrone ici, uniquement la vérification de signature et une
 *     écriture en base.
 *  4. Notch Pay réessaie les livraisons en échec : chaque notification doit
 *     donc être traitée de façon idempotente (une notification rejouée ne
 *     doit rien changer la deuxième fois).
 *  5. Ne jamais faire confiance au montant/à la devise affirmés par la
 *     notification : comparaison avec ce que NOUS avions enregistré à
 *     l'initialisation. Le schéma Notch Pay ne transmet pas d'identifiant
 *     utilisateur explicite dans l'évènement — la vérification "bon
 *     utilisateur" repose donc sur le fait que `reference` est la clé
 *     primaire du Payment que nous avons nous-mêmes créé pour cet
 *     utilisateur (voir payment-actions.ts), jamais une valeur devinable
 *     ou modifiable côté client.
 *  6. Le retour du navigateur sur `callback` (voir notchpay.ts) ne sert
 *     JAMAIS à débloquer un téléchargement : seule cette notification,
 *     signature vérifiée, peut faire passer un paiement à SUCCESS.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-notch-signature");

  if (!verifyNotchPaySignature(rawBody, signature)) {
    console.error("[notchpay-webhook] signature invalide");
    return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
  }

  let event: {
    type?: string;
    data?: { reference?: string; merchant_reference?: string; amount?: number; currency?: string; status?: string };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("[notchpay-webhook] JSON invalide");
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Vérifié empiriquement (2026-09-26) sur une vraie transaction sandbox :
  // `reference` est l'identifiant INTERNE Notch Pay ("trx.test_..."),
  // `merchant_reference` est NOTRE référence (= Payment.id) telle que
  // transmise à l'initialisation. On priorise donc `merchant_reference`,
  // avec repli sur `reference` par prudence si un type d'évènement envoie
  // un jour un format différent.
  const ourReference = event.data?.merchant_reference ?? event.data?.reference;
  const notchReference = event.data?.reference;
  if (!ourReference) {
    console.error("[notchpay-webhook] reference manquante", event.type);
    return NextResponse.json({ error: "reference manquante" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: ourReference } });
  if (!payment) {
    console.error("[notchpay-webhook] paiement introuvable", ourReference);
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  if (payment.status !== "PENDING") {
    console.log("[notchpay-webhook] déjà traité (idempotent)", ourReference);
    return NextResponse.json({ ok: true });
  }

  const amountMatches = event.data?.amount === payment.amountFcfa;
  const currencyMatches = !event.data?.currency || event.data.currency === "XAF";

  if (!amountMatches || !currencyMatches) {
    console.error("[notchpay-webhook] incohérence montant/devise", ourReference, event.data);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Incohérence montant/devise" }, { status: 400 });
  }

  const status = event.data?.status; // "complete" | "failed" | "canceled" | "expired"

  if (event.type === "payment.complete" && status === "complete") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", providerRef: notchReference ?? payment.providerRef } }),
      prisma.document.update({ where: { id: payment.documentId }, data: { status: "PAID" } }),
    ]);
    console.log("[notchpay-webhook] paiement confirmé", ourReference);
  } else if (
    event.type === "payment.failed" ||
    // Vérifié empiriquement (2026-09-26) : les webhooks Notch Pay
    // enregistrés via leur propre dashboard utilisent "cancelled"
    // (orthographe britannique), alors que leur documentation officielle
    // liste "canceled" (une seule L) — on accepte les deux.
    event.type === "payment.canceled" ||
    event.type === "payment.cancelled" ||
    event.type === "payment.expired"
  ) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerRef: notchReference ?? payment.providerRef } });
    console.log("[notchpay-webhook] paiement échoué/annulé/expiré", ourReference, event.type);
  } else {
    // payment.created ou tout autre évènement informatif : rien à faire,
    // mais on répond 200 pour éviter des réessais inutiles de Notch Pay.
    console.log("[notchpay-webhook] évènement ignoré", event.type, ourReference);
  }

  return NextResponse.json({ ok: true });
}
