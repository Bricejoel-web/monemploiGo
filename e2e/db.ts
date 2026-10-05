import fs from "node:fs";
import path from "node:path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

/**
 * Accès direct à la base pour les tests qui écrivent (création de comptes,
 * jetons expirés, nettoyage). VERROU DE SÉCURITÉ : refusé si la base est
 * celle de production — ces tests ne tournent que sur une base de
 * développement (branche Neon « dev », voir docs/ROADMAP.md).
 */

// Identifiants (non secrets) des bases de production connues.
const PRODUCTION_DB_HOSTS = ["ep-floral-king-b5t4r9ak"];

/** Variable telle que la voit `next start` : .env.local prime sur .env. */
export function effectiveEnv(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  for (const file of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const match = fs.readFileSync(full, "utf8").match(new RegExp(`^${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m"));
    if (match) return match[1];
  }
  return undefined;
}

const databaseUrl = effectiveEnv("DATABASE_URL");

export const dbWritesAllowed = Boolean(databaseUrl && !PRODUCTION_DB_HOSTS.some((host) => databaseUrl.includes(host)));
export const DB_WRITES_SKIP_REASON = "base de production (ou absente) : tests écrivant en base désactivés — configurer une base de développement";

let client: PrismaClient | undefined;
export function testDb(): PrismaClient {
  if (!dbWritesAllowed) throw new Error(DB_WRITES_SKIP_REASON);
  neonConfig.webSocketConstructor = ws;
  client ??= new PrismaClient({ adapter: new PrismaNeon({ connectionString: databaseUrl! }) });
  return client;
}

/** Domaine réservé aux comptes de test, supprimés à la fin des tests. */
export const TEST_EMAIL_DOMAIN = "e2e.monemploigo.test";
export const testEmail = (label: string) => `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@${TEST_EMAIL_DOMAIN}`;

export async function deleteTestUsers() {
  if (!dbWritesAllowed) return;
  await testDb().user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}`, mode: "insensitive" } } });
}

/** E-mails « envoyés » pendant les tests (voir E2E_EMAIL_OUTBOX, mailer.ts). */
export const OUTBOX = path.join(process.cwd(), "e2e", ".outbox", "emails.jsonl");

export function lastEmailTo(to: string): { to: string; subject: string; text: string } | undefined {
  if (!fs.existsSync(OUTBOX)) return undefined;
  return fs
    .readFileSync(OUTBOX, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { to: string; subject: string; text: string })
    .filter((mail) => mail.to.toLowerCase() === to.toLowerCase())
    .at(-1);
}

/** Compte de test avec espace Pro, créé directement en base (base de développement uniquement). */
export async function createProUser(company: string) {
  const { hash } = await import("bcryptjs");
  const email = testEmail("dashboard");
  const user = await testDb().user.create({
    data: {
      email,
      name: "Responsable Test",
      passwordHash: await hash("Pro-Test#2026", 10),
      professionalAccount: {
        create: { companyName: company, managerName: "Responsable Test", email, phone: "+237 600000000", termsVersion: "test", proTermsVersion: "test", termsAcceptedAt: new Date() },
      },
    },
    select: { id: true, professionalAccount: { select: { id: true } } },
  });
  return { userId: user.id, accountId: user.professionalAccount!.id, email };
}

/**
 * Connecte le navigateur de test à ce compte sans passer par le formulaire
 * (déjà testé en phase 1) : cookie de session signé comme le fait le site
 * (src/lib/auth/session.ts), avec la clé locale SESSION_SECRET.
 */
export async function loginAs(context: import("@playwright/test").BrowserContext, userId: string, baseURL: string) {
  const { SignJWT } = await import("jose");
  const secret = effectiveEnv("SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET introuvable dans .env.local / .env");
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  await context.addCookies([{ name: "monemploigo_session", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** Compte particulier de test, créé directement en base (base de développement uniquement). */
export async function createUser(name: string, email = testEmail("particulier")) {
  const { hash } = await import("bcryptjs");
  const user = await testDb().user.create({
    data: { email, name, passwordHash: await hash("Pro-Test#2026", 10), termsVersion: "test", termsAcceptedAt: new Date() },
    select: { id: true, email: true },
  });
  return { userId: user.id, email: user.email };
}
