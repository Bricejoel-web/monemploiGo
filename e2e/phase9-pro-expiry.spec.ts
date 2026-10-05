import fs from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, OUTBOX, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 9 (MonEmploiGo Pro) : expiration, avertissements (jour de
// l'expiration, J-30 et J-7 avant suppression) et suppression au terme des
// 90 jours de lecture seule (CGU Pro, article 11), par la tâche quotidienne.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.skip(({ isMobile }) => isMobile, "joué une fois, sur ordinateur");
test.describe.configure({ mode: "serial" });
test.afterAll(deleteTestUsers);
test.slow();

/** Période de 30 jours qui a expiré il y a `daysAgo` jours. */
async function expiredPeriod(accountId: string, daysAgo: number) {
  const expiresAt = new Date(Date.now() - daysAgo * DAY);
  return testDb().subscription.create({
    data: { professionalAccountId: accountId, priceFcfa: 5000, startsAt: new Date(expiresAt.getTime() - 30 * DAY), expiresAt },
  });
}

const emailsTo = (to: string) =>
  fs.existsSync(OUTBOX)
    ? fs
        .readFileSync(OUTBOX, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as { to: string; subject: string; text: string })
        .filter((mail) => mail.to.toLowerCase() === to.toLowerCase())
    : [];

async function runCron(request: APIRequestContext) {
  const response = await request.get("/api/cron/purge-documents", { headers: { Authorization: "Bearer e2e-cron-secret" } });
  expect(response.status()).toBe(200);
  return response.json();
}

test("sans secret, la tâche quotidienne refuse de tourner", async ({ request }) => {
  expect((await request.get("/api/cron/purge-documents")).status()).toBe(401);
  expect((await request.get("/api/cron/purge-documents", { headers: { Authorization: "Bearer mauvais" } })).status()).toBe(401);
});

test("jour de l'expiration : un seul e-mail, même si la tâche passe deux fois", async ({ request }) => {
  const pro = await createProUser("Agence Expire Aujourdhui");
  await expiredPeriod(pro.accountId, 0.2);
  await runCron(request);
  await runCron(request);
  const mails = emailsTo(pro.email);
  expect(mails).toHaveLength(1);
  expect(mails[0].subject).toBe("Votre abonnement MonEmploiGo Pro a expiré");
  expect(mails[0].text).toContain("Bonjour Agence Expire Aujourdhui,");
  expect(mails[0].text).toContain("/fr/pro/abonnement");
  const notices = await testDb().proExpiryNotice.findMany({ where: { professionalAccountId: pro.accountId } });
  expect(notices.map((n) => [n.kind, n.emailSent])).toEqual([["EXPIRED", true]]);
});

test("J-30 puis J-7 avant suppression : seul le plus urgent part si la tâche a été manquée", async ({ request }) => {
  const at30 = await createProUser("Agence J30");
  await expiredPeriod(at30.accountId, 65);
  const at7 = await createProUser("Agence J7");
  await expiredPeriod(at7.accountId, 85);
  await runCron(request);

  const mails30 = emailsTo(at30.email);
  expect(mails30).toHaveLength(1);
  expect(mails30[0].subject).toBe("MonEmploiGo Pro : suppression de vos données dans 30 jours");
  const mails7 = emailsTo(at7.email);
  expect(mails7).toHaveLength(1);
  expect(mails7[0].subject).toBe("MonEmploiGo Pro : suppression de vos données dans 7 jours");
  // Les avertissements dépassés sont notés, sans e-mail : ils ne partiront jamais.
  const notices7 = await testDb().proExpiryNotice.findMany({ where: { professionalAccountId: at7.accountId }, orderBy: { kind: "asc" } });
  expect(notices7.map((n) => [n.kind, n.emailSent])).toEqual([
    ["EXPIRED", false],
    ["DELETION_IN_30_DAYS", false],
    ["DELETION_IN_7_DAYS", true],
  ]);
});

test("après 90 jours : candidats et documents supprimés, structure et historique conservés", async ({ page, context, request }) => {
  const pro = await createProUser("Agence Purgée");
  await expiredPeriod(pro.accountId, 100);
  const candidate = await testDb().professionalCandidate.create({ data: { professionalAccountId: pro.accountId, firstName: "Ancien", lastName: "Candidat" } });
  await testDb().document.create({
    data: { userId: pro.userId, professionalAccountId: pro.accountId, candidateId: candidate.id, type: "COVER_LETTER", templateSlug: "classique", title: "Lettre", contentJson: "{}" },
  });

  // Renouvellement en cours de paiement : rien n'est supprimé.
  const pending = await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING" },
  });
  await runCron(request);
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId } })).toBe(1);

  await testDb().payment.update({ where: { id: pending.id }, data: { status: "FAILED" } });
  await runCron(request);
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
  expect(await testDb().document.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
  expect(await testDb().professionalAccount.count({ where: { id: pro.accountId } })).toBe(1);
  expect(await testDb().subscription.count({ where: { professionalAccountId: pro.accountId } })).toBe(1);
  // Aucun e-mail pour un espace déjà au-delà des 90 jours.
  expect(emailsTo(pro.email)).toHaveLength(0);

  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByText("Votre abonnement Pro Starter a expiré le", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Renouveler mon abonnement" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/abonnement$/);
});

test("abonnement actif : rien n'est touché, aucun e-mail", async ({ request }) => {
  const pro = await createProUser("Agence Active");
  const startsAt = new Date(Date.now() - 5 * DAY);
  await testDb().subscription.create({ data: { professionalAccountId: pro.accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY) } });
  await testDb().professionalCandidate.create({ data: { professionalAccountId: pro.accountId, firstName: "Actuel", lastName: "Candidat" } });
  await runCron(request);
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId } })).toBe(1);
  expect(emailsTo(pro.email)).toHaveLength(0);
});
