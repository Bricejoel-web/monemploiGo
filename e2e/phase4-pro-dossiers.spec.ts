import { expect, test, type BrowserContext } from "@playwright/test";
import { expectNoHorizontalScroll, gotoReady, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 4 (MonEmploiGo Pro) : dossiers candidats — modifier, archiver,
// réactiver, supprimer définitivement (avec confirmation), lecture seule
// après expiration, isolation entre structures.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.afterAll(deleteTestUsers);
const acceptCookies = (context: BrowserContext) => context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

async function subscription(accountId: string, { expired = false, documentsUsed = 0 } = {}) {
  const startsAt = new Date(Date.now() - (expired ? 40 : 1) * DAY);
  return testDb().subscription.create({
    data: { professionalAccountId: accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY), documentsUsed },
  });
}

async function candidate(accountId: string, data: { firstName: string; lastName?: string; status?: "ACTIVE" | "ARCHIVED" } = { firstName: "Jean" }) {
  return testDb().professionalCandidate.create({ data: { lastName: "Dupont", ...data, professionalAccountId: accountId } });
}

test("modifier : formulaire prérempli, enregistrement, dossier mis à jour", async ({ page, context }) => {
  const pro = await createProUser("Structure Modification");
  await subscription(pro.accountId);
  const c = await testDb().professionalCandidate.create({
    data: { professionalAccountId: pro.accountId, firstName: "Aline", lastName: "Mbarga", destinationCountry: "Canada", applicationType: "Emploi" },
  });
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, `/fr/pro/candidats/${c.id}`);
  await page.getByRole("link", { name: "Modifier" }).click();
  await expect(page.getByLabel("Prénom *", { exact: true })).toHaveValue("Aline");
  await expect(page.getByLabel("Pays de destination")).toHaveValue("Canada");

  await page.getByLabel("Pays de destination").fill("Allemagne");
  await page.getByLabel("Type de candidature").selectOption("Ausbildung");
  await page.getByLabel("Domaine professionnel").fill("Pflege");
  await page.getByLabel("Niveau d'allemand").selectOption("B2");
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();

  await expect(page).toHaveURL(new RegExp(`/fr/pro/candidats/${c.id}\\?modifie=1$`));
  await expect(page.getByText("Les informations du candidat ont été enregistrées.")).toBeVisible();
  await expect(page.getByText("Ausbildung Pflege")).toBeVisible();
  const saved = await testDb().professionalCandidate.findUniqueOrThrow({ where: { id: c.id } });
  expect(saved.destinationCountry).toBe("Allemagne");
  expect(saved.germanLevel).toBe("B2");
});

test("archiver puis réactiver ; réactivation refusée si 10 actifs", async ({ page, context }) => {
  const pro = await createProUser("Structure Archivage");
  await subscription(pro.accountId);
  const c = await candidate(pro.accountId, { firstName: "Paul" });
  await loginAs(context, pro.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/candidats/${c.id}`);
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.getByText("Le candidat a été archivé", { exact: false })).toBeVisible();
  expect((await testDb().professionalCandidate.findUniqueOrThrow({ where: { id: c.id } })).status).toBe("ARCHIVED");

  await page.getByRole("button", { name: "Réactiver" }).click();
  await expect(page.getByText("Le candidat est de nouveau actif.")).toBeVisible();
  expect((await testDb().professionalCandidate.findUniqueOrThrow({ where: { id: c.id } })).status).toBe("ACTIVE");

  // Archivé une nouvelle fois, puis 10 autres candidats actifs : plus de place.
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.getByText("Le candidat a été archivé", { exact: false })).toBeVisible();
  await testDb().professionalCandidate.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({ professionalAccountId: pro.accountId, firstName: `Actif${i}`, lastName: "Test" })),
  });
  await page.getByRole("button", { name: "Réactiver" }).click();
  await expect(page.getByText("Limite de 10 candidats actifs atteinte", { exact: false })).toBeVisible();
  expect((await testDb().professionalCandidate.findUniqueOrThrow({ where: { id: c.id } })).status).toBe("ARCHIVED");
});

test("supprimer : confirmation obligatoire, candidat et documents supprimés, quota non rendu", async ({ page, context }) => {
  const pro = await createProUser("Structure Suppression");
  const period = await subscription(pro.accountId, { documentsUsed: 3 });
  const c = await candidate(pro.accountId, { firstName: "Brice", lastName: "Fotsing" });
  await testDb().document.create({
    data: { userId: pro.userId, professionalAccountId: pro.accountId, candidateId: c.id, type: "CV", templateSlug: "test", title: "CV test", contentJson: "{}" },
  });
  await loginAs(context, pro.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/candidats/${c.id}`);
  await page.getByRole("link", { name: "Supprimer définitivement" }).click();
  await expect(page.getByRole("heading", { name: "Supprimer définitivement Brice Fotsing ?" })).toBeVisible();
  await expect(page.getByText("le candidat sera supprimé ;")).toBeVisible();
  await expect(page.getByText("ses documents seront supprimés (1 document)", { exact: false })).toBeVisible();
  await expect(page.getByText("cette action est définitive", { exact: false })).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Sans la case cochée : refusé par le serveur (validation du navigateur contournée).
  await page.locator("form").filter({ has: page.getByRole("button", { name: "Supprimer définitivement" }) }).evaluate((f) => f.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Cochez la case de confirmation", { exact: false })).toBeVisible();
  expect(await testDb().professionalCandidate.count({ where: { id: c.id } })).toBe(1);

  await page.getByLabel("Je comprends que la suppression", { exact: false }).check();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/candidats\?supprime=1$/);
  await expect(page.getByText("Le candidat et ses documents ont été supprimés définitivement.")).toBeVisible();

  expect(await testDb().professionalCandidate.count({ where: { id: c.id } })).toBe(0);
  expect(await testDb().document.count({ where: { candidateId: c.id } })).toBe(0);
  expect((await testDb().subscription.findUniqueOrThrow({ where: { id: period.id } })).documentsUsed).toBe(3);
});

test("lecture seule après expiration : consultation et suppression possibles, rien d'autre", async ({ page, context }) => {
  const pro = await createProUser("Structure Expirée");
  await subscription(pro.accountId, { expired: true });
  const c = await candidate(pro.accountId, { firstName: "Ancien" });
  await loginAs(context, pro.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/candidats/${c.id}`);
  await expect(page.getByText("Abonnement non actif : dossier en lecture seule.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Archiver" })).toHaveCount(0);
  await page.goto(`/fr/pro/candidats/${c.id}/modifier`);
  await expect(page.getByText("ne peut plus être modifié", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toHaveCount(0);

  // La suppression reste possible (droit à l'effacement).
  await gotoReady(page, `/fr/pro/candidats/${c.id}/supprimer`);
  await page.getByLabel("Je comprends que la suppression", { exact: false }).check();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/candidats\?supprime=1$/);
  expect(await testDb().professionalCandidate.count({ where: { id: c.id } })).toBe(0);
});

test("onglet resté ouvert : archivage refusé par le serveur si l'abonnement a expiré entre-temps", async ({ page, context }) => {
  const pro = await createProUser("Structure Onglet");
  const period = await subscription(pro.accountId);
  const c = await candidate(pro.accountId, { firstName: "Onglet" });
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, `/fr/pro/candidats/${c.id}`);
  await expect(page.getByRole("button", { name: "Archiver" })).toBeVisible();

  await testDb().subscription.update({ where: { id: period.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.getByText("ce dossier ne peut plus être modifié", { exact: false })).toBeVisible();
  expect((await testDb().professionalCandidate.findUniqueOrThrow({ where: { id: c.id } })).status).toBe("ACTIVE");
});

test("isolation : modifier ou supprimer le dossier d'une autre structure est impossible", async ({ browser }) => {
  const a = await createProUser("Structure A");
  await subscription(a.accountId);
  const secret = await candidate(a.accountId, { firstName: "Secret", lastName: "DeA" });
  const b = await createProUser("Structure B");
  await subscription(b.accountId);

  const ctx = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(ctx);
  await loginAs(ctx, b.userId, BASE_URL);
  const page = await ctx.newPage();
  for (const path of [`/fr/pro/candidats/${secret.id}/modifier`, `/fr/pro/candidats/${secret.id}/supprimer`]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Cette page n'existe pas dans votre espace." }), path).toBeVisible();
    await expect(page.getByText("Secret")).toHaveCount(0);
  }
  expect(await testDb().professionalCandidate.count({ where: { id: secret.id, status: "ACTIVE" } })).toBe(1);
  await ctx.close();
});
