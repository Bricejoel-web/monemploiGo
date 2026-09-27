import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi d'e-mails via un compte Gmail dédié au site (SMTP de Google, avec
 * un "mot de passe d'application" — jamais le mot de passe du compte).
 * Choisi parce que le site n'a pas de nom de domaine propre : les services
 * d'envoi gratuits (Resend, Brevo...) exigent un domaine vérifié pour ne pas
 * finir en spam, alors que Gmail signe lui-même ses messages (DKIM).
 * Limite Google : environ 500 e-mails par jour.
 *
 * Comme toute dépendance externe du site, l'envoi est facultatif : sans
 * GMAIL_USER / GMAIL_APP_PASSWORD, rien n'est envoyé et rien ne casse.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Vrai si l'envoi d'e-mails est configuré (sinon, aucun e-mail ne part). */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    // Google affiche le mot de passe d'application par groupes de 4
    // caractères séparés par des espaces : on les retire s'ils ont été copiés.
    auth: { user, pass: pass.replace(/\s+/g, "") },
  });
  return transporter;
}

/** Renvoie `true` si l'e-mail est parti, `false` sinon (jamais d'exception). */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.info("[email] envoi désactivé (GMAIL_USER / GMAIL_APP_PASSWORD absents) :", email.subject);
    return false;
  }
  try {
    await transport.sendMail({
      from: { name: "monemploiGo", address: process.env.GMAIL_USER! },
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return true;
  } catch (error) {
    // Un e-mail qui ne part pas ne doit jamais faire échouer l'action qui
    // l'a déclenché (inscription...) : on journalise, sans l'adresse.
    console.error("[email] échec d'envoi :", error instanceof Error ? error.message : error);
    return false;
  }
}
