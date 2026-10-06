import "server-only";
import { PRO_STARTER } from "@/lib/pro/plans";
import { sendEmail } from "./mailer";
import { escapeHtml } from "./html";

const NAVY = "#16324f";
const BRAND = "#eb5757";
const INK = "#171512";
const MUTED = "#5f5a52";

/**
 * Bienvenue dans l'espace Pro, envoyé à l'e-mail professionnel à la création
 * de l'espace (inscription Pro ou espace ajouté à un compte existant). Rien
 * que l'offre réelle (plans.ts) et les étapes suivantes, sans promesse.
 */
export async function sendProWelcomeEmail({ to, companyName, managerName }: { to: string; companyName: string; managerName: string }): Promise<boolean> {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const subject = `Bienvenue dans MonEmploiGo Pro, ${companyName}`;
  const intro = `Bonjour ${managerName},`;
  const lines = [
    `L'espace professionnel de ${companyName} est créé. Il vous permet de préparer les CV et lettres de motivation de vos candidats, avec les mêmes modèles que le site.`,
    `Pour commencer, activez Pro Starter : ${PRO_STARTER.priceFcfa} FCFA pour ${PRO_STARTER.periodDays} jours, jusqu'à ${PRO_STARTER.maxActiveCandidates} candidats actifs et ${PRO_STARTER.maxDocumentsPerPeriod} documents finalisés par période, sans renouvellement automatique.`,
    "Ensuite : ajoutez vos candidats, créez leurs documents, puis finalisez-les pour les télécharger.",
  ];
  const outro = "Une question ? Répondez simplement à cet e-mail ou écrivez à monemploigo.contact@gmail.com.";
  const dashboardUrl = `${base}/fr/pro/dashboard`;
  const termsUrl = `${base}/fr/pro/conditions-utilisation`;

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
            <p style="margin:0 0 14px 0;font-size:20px;font-weight:bold;">${escapeHtml(intro)}</p>
            ${lines.map((l) => `<p style="margin:0 0 14px 0;">${escapeHtml(l)}</p>`).join("\n            ")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 22px 28px;">
            <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:${BRAND};background-image:linear-gradient(90deg,#f2994a,${BRAND});color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:999px;">Ouvrir mon espace Pro</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;font-size:13px;line-height:20px;color:${MUTED};">
            <p style="margin:0 0 10px 0;">${escapeHtml(outro)}</p>
            <p style="margin:0;"><a href="${escapeHtml(termsUrl)}" style="color:${MUTED};">Conditions d'utilisation de MonEmploiGo Pro</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [intro, "", ...lines, "", `Ouvrir mon espace Pro : ${dashboardUrl}`, "", outro, `Conditions d'utilisation de MonEmploiGo Pro : ${termsUrl}`].join("\n");
  return sendEmail({ to, subject, html, text });
}
