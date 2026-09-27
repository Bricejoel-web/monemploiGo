import "server-only";
import { sendEmail } from "./mailer";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DOCUMENT_LABELS: Record<string, string> = {
  CV: "CV",
  COVER_LETTER: "Lettre de motivation",
  BEWERBUNGSBRIEF: "Bewerbungsbrief",
};

/**
 * Prévient l'équipe (la boîte Gmail du site) de chaque nouvel avis, pour
 * qu'elle les lise sans page d'administration. "Répondre" écrit directement
 * au client. E-mail interne : toujours en français.
 */
export async function notifyNewReview(review: {
  rating: number;
  comment: string | null;
  isUpdate: boolean;
  customerEmail: string;
  customerName: string | null;
  documentType: string;
  category: string | null;
  templateSlug: string;
}): Promise<boolean> {
  const teamAddress = process.env.GMAIL_USER;
  if (!teamAddress) return false;

  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const documentLabel = [DOCUMENT_LABELS[review.documentType] ?? review.documentType, review.category].filter(Boolean).join(" · ");
  const customer = review.customerName ? `${review.customerName} <${review.customerEmail}>` : review.customerEmail;
  const subject = `${review.isUpdate ? "Avis modifié" : "Nouvel avis"} : ${stars} (${review.rating}/5)`;

  const rows: [string, string][] = [
    ["Note", `${stars} (${review.rating}/5)`],
    ["Commentaire", review.comment || "(aucun commentaire)"],
    ["Client", customer],
    ["Document", `${documentLabel} — modèle ${review.templateSlug}`],
  ];

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#171512;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:20px 24px;border-bottom:3px solid #eb5757;font-size:17px;font-weight:bold;">${escapeHtml(subject)}</td></tr>
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:12px 24px 0 24px;font-size:12px;color:#5f5a52;text-transform:uppercase;letter-spacing:.05em;">${escapeHtml(label)}</td></tr>
<tr><td style="padding:4px 24px 0 24px;font-size:15px;line-height:22px;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
<tr><td style="padding:20px 24px;font-size:12px;color:#5f5a52;">Pour répondre au client, utilisez simplement « Répondre ».</td></tr>
</table>
</body></html>`;

  const text = [subject, "", ...rows.map(([label, value]) => `${label} : ${value}`), "", "Pour répondre au client, utilisez simplement « Répondre »."].join("\n");

  return sendEmail({ to: teamAddress, subject, html, text, replyTo: review.customerEmail });
}
