import "server-only";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sendEmail, type OutgoingEmail } from "./mailer";
import { escapeHtml, fill } from "./html";

const NAVY = "#16324f";
const BRAND = "#eb5757";
const INK = "#171512";
const MUTED = "#5f5a52";


/**
 * E-mail de bienvenue envoyé juste après l'inscription : confirme la
 * création du compte, explique le fonctionnement du site et donne quelques
 * conseils. Mise en page en tableaux et styles en ligne, seule approche
 * fiable dans les messageries (Gmail, Outlook, applications mobiles).
 */
export async function buildWelcomeEmail({
  to,
  firstName,
  locale,
}: {
  to: string;
  firstName: string;
  locale: Locale;
}): Promise<OutgoingEmail> {
  const t = (await getDictionary(locale)).welcomeEmail;
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const ctaUrl = `${baseUrl}/${locale}/cv`;

  const subject = fill(t.subject, { firstName });
  const greeting = fill(t.greeting, { firstName: escapeHtml(firstName) });
  const confirmed = fill(escapeHtml(t.confirmed), { email: `<strong>${escapeHtml(to)}</strong>` });

  const steps = t.steps
    .map(
      (step, i) => `
        <tr>
          <td valign="top" style="padding:0 12px 10px 0;width:28px;">
            <div style="width:26px;height:26px;border-radius:13px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:bold;line-height:26px;text-align:center;">${i + 1}</div>
          </td>
          <td valign="top" style="padding:3px 0 10px 0;font-size:15px;line-height:22px;color:${INK};">${escapeHtml(step)}</td>
        </tr>`,
    )
    .join("");

  const tips = t.tips
    .map(
      (tip) => `
        <tr>
          <td valign="top" style="padding:0 10px 10px 0;width:18px;font-size:15px;line-height:22px;color:#059669;font-weight:bold;">&#10003;</td>
          <td valign="top" style="padding:0 0 10px 0;font-size:14px;line-height:21px;color:${INK};">${escapeHtml(tip)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#efe6d8;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(t.preheader)}</div>
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
          <td style="padding:28px 28px 8px 28px;">
            <p style="margin:0 0 12px 0;font-size:20px;font-weight:bold;color:${INK};">${greeting}</p>
            <p style="margin:0 0 22px 0;font-size:15px;line-height:23px;color:${INK};">${confirmed}</p>
            <p style="margin:0 0 12px 0;font-size:16px;font-weight:bold;color:${NAVY};">${escapeHtml(t.stepsTitle)}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${steps}</table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:10px 28px 26px 28px;">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND};background-image:linear-gradient(90deg,#f2994a,${BRAND});color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:999px;">${escapeHtml(t.cta)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3faf6;border:1px solid #cdeedd;border-radius:12px;">
              <tr>
                <td style="padding:18px 18px 8px 18px;">
                  <p style="margin:0 0 12px 0;font-size:16px;font-weight:bold;color:${NAVY};">${escapeHtml(t.tipsTitle)}</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${tips}</table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 0 28px;">
            <p style="margin:0;padding:14px 16px;background:#eff7fd;border:1px solid #cfe6f7;border-radius:12px;font-size:14px;line-height:21px;color:${NAVY};">${escapeHtml(t.retention)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 28px 28px;font-size:15px;line-height:22px;color:${INK};">
            ${escapeHtml(t.signoff)}<br><strong>${escapeHtml(t.team)}</strong>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr>
          <td style="padding:16px 20px;font-size:12px;line-height:18px;color:${MUTED};text-align:center;">${escapeHtml(t.footer)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    fill(t.greeting, { firstName }),
    "",
    fill(t.confirmed, { email: to }),
    "",
    t.stepsTitle,
    ...t.steps.map((step, i) => `${i + 1}. ${step}`),
    "",
    `${t.cta} : ${ctaUrl}`,
    "",
    t.tipsTitle,
    ...t.tips.map((tip) => `- ${tip}`),
    "",
    t.retention,
    "",
    t.signoff,
    t.team,
    "",
    "--",
    t.footer,
  ].join("\n");

  return { to, subject, html, text };
}

export async function sendWelcomeEmail(params: { to: string; firstName: string; locale: Locale }): Promise<boolean> {
  return sendEmail(await buildWelcomeEmail(params));
}
