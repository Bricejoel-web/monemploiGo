import "server-only";
import { formatLongDate } from "@/lib/format-date";
import { sendEmail } from "./mailer";
import { escapeHtml } from "./html";

const NAVY = "#16324f";
const BRAND = "#eb5757";
const INK = "#171512";

export type ProExpiryEmailKind = "EXPIRED" | "DELETION_IN_30_DAYS" | "DELETION_IN_7_DAYS";

/**
 * Avertissements d'expiration Pro (CGU Pro, article 11) : le jour de
 * l'expiration, puis 30 et 7 jours avant la suppression définitive. Aucune
 * donnée de candidat dans l'e-mail : seulement le nom de la structure et
 * les dates.
 */
export async function sendProExpiryEmail({
  to,
  companyName,
  kind,
  expiredAt,
  deletionAt,
  renewUrl,
}: {
  to: string;
  companyName: string;
  kind: ProExpiryEmailKind;
  expiredAt: Date;
  deletionAt: Date;
  renewUrl: string;
}): Promise<boolean> {
  const expired = formatLongDate(expiredAt, "fr");
  const deletion = formatLongDate(deletionAt, "fr");
  const subject =
    kind === "EXPIRED"
      ? "Votre abonnement MonEmploiGo Pro a expiré"
      : kind === "DELETION_IN_30_DAYS"
        ? "MonEmploiGo Pro : suppression de vos données dans 30 jours"
        : "MonEmploiGo Pro : suppression de vos données dans 7 jours";
  const lines = [
    kind === "EXPIRED"
      ? `Votre abonnement Pro Starter a expiré le ${expired}. Votre espace professionnel est désormais en lecture seule : vous pouvez consulter et télécharger vos documents finalisés, mais plus créer ni modifier.`
      : `Votre abonnement Pro Starter a expiré le ${expired} et votre espace est en lecture seule.`,
    `Sans renouvellement, vos candidats, vos brouillons et vos documents seront supprimés définitivement le ${deletion}.`,
    "Un renouvellement rétablit immédiatement l'accès complet, avec toutes vos données.",
  ];

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#efe6d8;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe6d8;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:${NAVY};padding:22px 28px;border-bottom:4px solid ${BRAND};">
            <span style="font-size:22px;font-weight:bold;color:#ffffff;">monemploi</span><span style="font-size:22px;font-weight:bold;color:${BRAND};">Go</span>
            <span style="font-size:12px;font-weight:bold;color:#ffffff;"> PRO</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px 28px;font-size:15px;line-height:23px;color:${INK};">
            <p style="margin:0 0 12px 0;font-size:20px;font-weight:bold;">Bonjour ${escapeHtml(companyName)},</p>
            ${lines.map((l) => `<p style="margin:0 0 14px 0;">${escapeHtml(l)}</p>`).join("\n            ")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 22px 28px;">
            <a href="${escapeHtml(renewUrl)}" style="display:inline-block;background:${BRAND};background-image:linear-gradient(90deg,#f2994a,${BRAND});color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:999px;">Renouveler mon abonnement</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;font-size:14px;line-height:21px;color:${INK};">
            <p style="margin:0;">L'équipe MonEmploiGo</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [`Bonjour ${companyName},`, "", ...lines, "", `Renouveler mon abonnement : ${renewUrl}`, "", "L'équipe MonEmploiGo"].join("\n");
  return sendEmail({ to, subject, html, text });
}
