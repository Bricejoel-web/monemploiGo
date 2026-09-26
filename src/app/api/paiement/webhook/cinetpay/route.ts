import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getGateway } from "@/lib/payment";

/**
 * Notification serveur-à-serveur CinetPay. Par mesure de sécurité (recommandé
 * par CinetPay pour éviter toute usurpation), on ne fait jamais confiance au
 * contenu du webhook lui-même : on l'utilise uniquement pour savoir QUELLE
 * transaction vérifier, puis on interroge l'API de vérification CinetPay pour
 * obtenir le statut réel avant de mettre à jour la base de données.
 */
export async function POST(request: Request) {
  let transactionId: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    transactionId = typeof body.cpm_trans_id === "string" ? body.cpm_trans_id : null;
  } else {
    const form = await request.formData().catch(() => null);
    transactionId = (form?.get("cpm_trans_id") as string | null) ?? null;
  }

  if (!transactionId) {
    return NextResponse.json({ error: "cpm_trans_id manquant" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: transactionId } });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json({ ok: true }); // déjà traité
  }

  const gateway = getGateway(payment.provider);
  const result = await gateway.checkStatus({ provider: payment.provider, providerRef: payment.id });

  if (result.status === "success") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS" } }),
      prisma.document.update({ where: { id: payment.documentId }, data: { status: "PAID" } }),
    ]);
  } else if (result.status === "failed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  return NextResponse.json({ ok: true });
}
