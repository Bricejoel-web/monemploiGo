import "server-only";
import { sendEmail } from "./mailer";
import { escapeHtml } from "./html";

const NAVY = "#16324f";
const BRAND = "#eb5757";
const INK = "#171512";
const MUTED = "#5f5a52";

/** Lien de vérification de l'adresse e-mail (accès administrateur). */
export async function sendEmailVerificationEmail({ to, url }: { to: string; url: string }): Promise<boolean> {
  const subject = "Confirmez votre adresse e-mail monemploiGo";
  const lines = [
    "Pour accéder à l'administration de monemploiGo, confirmez que cette adresse vous appartient.",
    "Ouvrez le lien ci-dessous depuis le navigateur où vous êtes connecté. Il est valable 1 heure et ne sert qu'une fois.",
  ];
  const ignore = "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : rien ne change sur votre compte.";

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
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px 28px;font-size:15px;line-height:23px;color:${INK};">
            ${lines.map((l) => `<p style="margin:0 0 14px 0;">${escapeHtml(l)}</p>`).join("\n            ")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 22px 28px;">
            <a href="${escapeHtml(url)}" style="display:inline-block;background:${BRAND};background-image:linear-gradient(90deg,#f2994a,${BRAND});color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:999px;">Confirmer mon adresse</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;font-size:14px;line-height:21px;color:${MUTED};">
            <p style="margin:0;">${escapeHtml(ignore)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [...lines, "", `Confirmer mon adresse : ${url}`, "", ignore].join("\n");
  return sendEmail({ to, subject, html, text });
}
