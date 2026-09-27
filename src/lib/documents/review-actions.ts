"use server";

import { after } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { rateLimit } from "@/lib/security/rate-limit";
import { locales } from "@/i18n/config";
import { notifyNewReview } from "@/lib/email/review-notification";

export type ReviewActionResult = { ok: true } | { ok: false; error: "session" | "invalid" | "rateLimited" | "notEligible" };

const ReviewSchema = z.object({
  documentId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
  locale: z.enum(locales),
});

/**
 * Enregistre (ou modifie) l'avis unique du client sur le service. Seul un
 * client ayant payé un document peut donner son avis : l'avis porte sur une
 * expérience réelle, et on évite les notes laissées par simple curiosité.
 */
export async function submitReviewAction(input: {
  documentId: string;
  rating: number;
  comment: string;
  locale: string;
}): Promise<ReviewActionResult> {
  const session = await verifySession();
  if (!session) return { ok: false, error: "session" };

  if (!rateLimit(`review:${session.userId}`, 10, 15 * 60 * 1000).allowed) {
    return { ok: false, error: "rateLimited" };
  }

  const parsed = ReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { documentId, rating, locale } = parsed.data;
  const comment = parsed.data.comment || null;

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: session.userId, status: "PAID" },
    select: { id: true, type: true, category: true, templateSlug: true },
  });
  if (!document) return { ok: false, error: "notEligible" };

  const existing = await prisma.review.findUnique({ where: { userId: session.userId }, select: { id: true } });
  await prisma.review.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      documentId: document.id,
      rating,
      comment,
      documentType: document.type,
      category: document.category,
      templateSlug: document.templateSlug,
      locale,
    },
    update: { rating, comment, locale },
  });

  after(async () => {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } });
    if (!user) return;
    await notifyNewReview({
      rating,
      comment,
      isUpdate: Boolean(existing),
      customerEmail: user.email,
      customerName: user.name,
      documentType: document.type,
      category: document.category,
      templateSlug: document.templateSlug,
    });
  });

  return { ok: true };
}
