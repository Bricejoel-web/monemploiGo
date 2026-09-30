import "server-only";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sendEmail } from "./mailer";
import { escapeHtml, fill } from "./html";

const NAVY = "#16324f";
const BRAND = "#eb5757";
const INK = "#171512";
const MUTED = "#5f5a52";

/**
 * E-mail « mot de passe oublié » : un bouton vers le formulaire de nouveau
 * mot de passe. Le lien contient le jeton en clair : il n'apparaît que dans
 * cet e-mail (jamais journalisé, jamais stocké).
 */
export async function sendPasswordResetEmail({ to, resetUrl, locale }: { to: string; resetUrl: string; locale: Locale }) {
  const t = (await getDictionary(locale)).passwordReset.email;
  const intro = fill(escapeHtml(t.intro), { email: `<strong>${escapeHtml(to)}</strong>` });

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#efe6d8;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe6d8;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:${NAVY};padding:22px 28px;border-bottom:4px solid ${BRAND};">
            <span style="font-size:22px;font-weight:bold;color:#ffffff;">monemploi</span><span style="font-size:22px;font-weight:bold;color:${BRAND};">Go</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px 28px;font-size:15px;line-height:23px;color:${INK};">
            <p style="margin:0 0 12px 0;font-size:20px;font-weight:bold;">${escapeHtml(t.greeting)}</p>
            <p style="margin:0 0 20px 0;">${intro}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 22px 28px;">
            <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:${BRAND};background-image:linear-gradient(90deg,#f2994a,${BRAND});color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:999px;">${escapeHtml(t.cta)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;font-size:14px;line-height:21px;color:${INK};">
            <p style="margin:0 0 12px 0;">${escapeHtml(t.validity)}</p>
            <p style="margin:0 0 20px 0;color:${MUTED};">${escapeHtml(t.ignore)}</p>
            <p style="margin:0;">${escapeHtml(t.signoff)}<br><strong>${escapeHtml(t.team)}</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    t.greeting,
    "",
    fill(t.intro, { email: to }),
    "",
    `${t.cta} : ${resetUrl}`,
    "",
    t.validity,
    t.ignore,
    "",
    t.signoff,
    t.team,
  ].join("\n");

  return sendEmail({ to, subject: t.subject, html, text });
}
