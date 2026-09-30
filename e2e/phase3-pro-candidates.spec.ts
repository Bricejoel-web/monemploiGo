import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, gotoReady, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 3 (MonEmploiGo Pro) : gestion des candidats — création, liste,
// recherche, filtres, limite de 10 candidats actifs, isolation.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.afterAll(deleteTestUsers);

// Bandeau cookies déjà accepté : fixé en bas de l'écran, il recouvrait le
// bouton d'envoi des formulaires longs et bloquait le clic.
const acceptCookies = (context: BrowserContext) =>
  context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

async function activeSubscription(accountId: string) {
  await testDb().subscription.create({
    data: { professionalAccountId: accountId, priceFcfa: 5000, startsAt: new Date(Date.now() - DAY), expiresAt: new Date(Date.now() + 29 * DAY) },
  });
}

async function addCandidates(accountId: string, rows: { firstName: string; lastName?: string; status?: "ACTIVE" | "ARCHIVED"; destinationCountry?: string }[]) {
  await testDb().professionalCandidate.createMany({ data: rows.map((r) => ({ lastName: "Test", ...r, professionalAccountId: accountId })) });
}

async function fillCandidate(page: Page, firstName: string, lastName: string) {
  await page.getByLabel("Prénom *", { exact: true }).fill(firstName);
  await page.getByLabel("Nom *", { exact: true }).fill(lastName);
}

test("création : dossier ouvert directement, niveau d'allemand si pertinent", async ({ page, context }) => {
  const pro = await createProUser("Structure Création");
  await activeSubscription(pro.accountId);
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats/nouveau");

  await fillCandidate(page, "Jean", "Dupont");
  await page.getByLabel("Email").fill("jean.dupont@example.com");
  await page.getByLabel("Téléphone").fill("+237 600 00 00 01");
  // Le niveau d'allemand n'apparaît que pour l'Allemagne (ou une Ausbildung).
  await expect(page.getByLabel("Niveau d'allemand")).toHaveCount(0);
  await page.getByLabel("Pays de destination").fill("Allemagne");
  await page.getByLabel("Domaine professionnel").fill("Pflege");
  await page.getByLabel("Type de candidature").selectOption("Ausbildung");
  await page.getByLabel("Niveau d'études").selectOption("Baccalauréat / GCE A Level");
  await page.getByLabel("Langues").fill("Français, Anglais, Allemand");
  await page.getByLabel("Niveau d'allemand").selectOption("B2");
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Créer le candidat" }).click();

  await expect(page).toHaveURL(/\/fr\/pro\/candidats\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "Jean Dupont" })).toBeVisible();
  await expect(page.getByText("Ausbildung Pflege")).toBeVisible();
  await expect(page.getByText("B2", { exact: true })).toBeVisible();
  await expect(page.getByText("Aucun document pour ce candidat.")).toBeVisible();

  const saved = await testDb().professionalCandidate.findFirst({ where: { professionalAccountId: pro.accountId } });
  expect(saved?.germanLevel).toBe("B2");
  expect(saved?.status).toBe("ACTIVE");
});

test("validation serveur : prénom et nom obligatoires, e-mail vérifié", async ({ page, context }) => {
  const pro = await createProUser("Structure Validation");
  await activeSubscription(pro.accountId);
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats/nouveau");
  await fillCandidate(page, "  ", "Test");
  await page.getByLabel("Email").fill("pas-un-email@");
  // Contourne la validation du navigateur pour tester celle du serveur.
  await page.locator("form").filter({ has: page.getByRole("button", { name: "Créer le candidat" }) }).evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Créer le candidat" }).click();
  await expect(page.getByText("Le prénom est obligatoire.")).toBeVisible();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
});

test("liste : colonnes, recherche et filtres", async ({ page, context }) => {
  const pro = await createProUser("Structure Liste");
  await activeSubscription(pro.accountId);
  await addCandidates(pro.accountId, [
    { firstName: "Aline", lastName: "Mbarga", destinationCountry: "Allemagne" },
    { firstName: "Paul", lastName: "Nkoulou", destinationCountry: "Canada" },
    { firstName: "Brice", lastName: "Fotsing", status: "ARCHIVED" },
  ]);
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats");

  await expect(page.getByRole("heading", { name: "Mes candidats" })).toBeVisible();
  await expect(page.getByText("Candidats : 2 / 10")).toBeVisible();
  const rows = page.locator("table tbody tr").filter({ visible: true });
  const cards = page.locator("ul li").filter({ visible: true });
  const items = (await rows.count()) > 0 ? rows : cards;
  await expect(items).toHaveCount(3);
  await expect(items.filter({ hasText: "Aline Mbarga" })).toContainText("Allemagne");
  await expect(items.filter({ hasText: "Brice Fotsing" })).toContainText("Archivé");

  await page.getByRole("searchbox", { name: "Rechercher un candidat" }).fill("mbarga");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/q=mbarga/);
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("Aline Mbarga");

  await page.goto("/fr/pro/candidats?statut=archives");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("Brice Fotsing");
  await page.getByRole("link", { name: "Actifs" }).click();
  await expect(items).toHaveCount(2);

  await items.filter({ hasText: "Paul Nkoulou" }).getByRole("link", { name: "Ouvrir le dossier" }).click();
  await expect(page.getByRole("heading", { name: "Paul Nkoulou" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("limite de 10 candidats actifs : formulaire bloqué, archivés hors limite", async ({ page, context }) => {
  const pro = await createProUser("Structure Pleine");
  await activeSubscription(pro.accountId);
  await addCandidates(pro.accountId, [
    ...Array.from({ length: 10 }, (_, i) => ({ firstName: `Actif${i}` })),
    ...Array.from({ length: 4 }, (_, i) => ({ firstName: `Archive${i}`, status: "ARCHIVED" as const })),
  ]);
  await loginAs(context, pro.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats/nouveau");
  await expect(page.getByText("Limite de 10 candidats actifs atteinte.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer le candidat" })).toHaveCount(0);
  await page.goto("/fr/pro/candidats");
  await expect(page.getByText("Candidats : 10 / 10")).toBeVisible();
});

test("tentative de dépassement : deux créations simultanées à 9 actifs → une seule passe", async ({ browser }) => {
  const pro = await createProUser("Structure Concurrence");
  await activeSubscription(pro.accountId);
  await addCandidates(pro.accountId, Array.from({ length: 9 }, (_, i) => ({ firstName: `Actif${i}` })));

  const contexts = await Promise.all([1, 2].map(() => browser.newContext({ baseURL: BASE_URL })));
  const pages = await Promise.all(
    contexts.map(async (ctx, i) => {
      await acceptCookies(ctx);
      await loginAs(ctx, pro.userId, BASE_URL);
      const page = await ctx.newPage();
      await gotoReady(page, "/fr/pro/candidats/nouveau");
      await fillCandidate(page, `Concurrent${i}`, "Test");
      return page;
    }),
  );
  await Promise.all(pages.map((page) => page.getByRole("button", { name: "Créer le candidat" }).click()));
  await Promise.all(
    pages.map((page) =>
      expect(page.getByRole("heading", { name: /Concurrent\d Test/ }).or(page.getByText("Limite de 10 candidats actifs atteinte.", { exact: false }))).toBeVisible(),
    ),
  );
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId, status: "ACTIVE" } })).toBe(10);
  await Promise.all(contexts.map((ctx) => ctx.close()));
});

test("sans abonnement actif : création impossible (y compris expiré)", async ({ page, context }) => {
  const none = await createProUser("Structure Sans Abonnement");
  await loginAs(context, none.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats/nouveau");
  await expect(page.getByText("Activez Pro Starter pour commencer à gérer vos candidats.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer le candidat" })).toHaveCount(0);

  const expired = await createProUser("Structure Expirée");
  await testDb().subscription.create({
    data: { professionalAccountId: expired.accountId, priceFcfa: 5000, startsAt: new Date(Date.now() - 40 * DAY), expiresAt: new Date(Date.now() - 10 * DAY) },
  });
  await addCandidates(expired.accountId, [{ firstName: "Ancien", lastName: "Dossier" }]);
  await context.clearCookies();
  await loginAs(context, expired.userId, BASE_URL);
  await gotoReady(page, "/fr/pro/candidats/nouveau");
  await expect(page.getByText("Votre abonnement Pro Starter a expiré", { exact: false })).toBeVisible();
  // Les dossiers existants restent consultables.
  await page.goto("/fr/pro/candidats");
  await expect(page.getByText("Ancien Dossier").filter({ visible: true })).toBeVisible();
});

test("isolation : le dossier d'une autre structure est introuvable", async ({ browser }) => {
  const a = await createProUser("Structure A");
  await activeSubscription(a.accountId);
  await addCandidates(a.accountId, [{ firstName: "Secret", lastName: "DeA" }]);
  const secret = await testDb().professionalCandidate.findFirstOrThrow({ where: { professionalAccountId: a.accountId } });
  const b = await createProUser("Structure B");

  const ctx = await browser.newContext({ baseURL: BASE_URL });
  await loginAs(ctx, b.userId, BASE_URL);
  const page = await ctx.newPage();
  await page.goto(`/fr/pro/candidats/${secret.id}`);
  await expect(page.getByRole("heading", { name: "Cette page n'existe pas dans votre espace." })).toBeVisible();
  await expect(page.getByText("Secret")).toHaveCount(0);
  await page.goto("/fr/pro/candidats?q=Secret");
  await expect(page.getByText("Aucun candidat ne correspond", { exact: false })).toBeVisible();
  await ctx.close();
});

test("accès sans connexion : redirigé vers la connexion Pro", async ({ page }) => {
  for (const path of ["/fr/pro/candidats", "/fr/pro/candidats/nouveau", "/fr/pro/candidats/un-identifiant"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/fr\/pro\/connexion$/);
  }
});
