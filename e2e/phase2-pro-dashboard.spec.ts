import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 2 (MonEmploiGo Pro) : tableau de bord. Chaque scénario prépare de
// vraies données en base (base de développement uniquement) et vérifie que
// l'affichage en découle exactement — jamais de chiffres d'exemple.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.afterAll(deleteTestUsers);

async function period(accountId: string, start: number | Date, documentsUsed = 0) {
  const startsAt = start instanceof Date ? start : new Date(Date.now() + start * DAY);
  return testDb().subscription.create({
    data: { professionalAccountId: accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY), documentsUsed },
  });
}

async function candidates(accountId: string, active: number, archived = 0) {
  const rows = [
    ...Array.from({ length: active }, (_, i) => ({ professionalAccountId: accountId, firstName: `Actif${i}`, lastName: "Test" })),
    ...Array.from({ length: archived }, (_, i) => ({ professionalAccountId: accountId, firstName: `Archive${i}`, lastName: "Test", status: "ARCHIVED" as const })),
  ];
  if (rows.length) await testDb().professionalCandidate.createMany({ data: rows });
}

const card = (page: Page, label: string) => page.getByRole("region", { name: "Statistiques" }).locator("div", { has: page.getByText(label, { exact: true }) }).first();

test("sans abonnement : « Non activé », aucun chiffre inventé", async ({ page, context }) => {
  const pro = await createProUser("Structure Sans Abonnement");
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");

  await expect(page.getByRole("heading", { name: "Bonjour, Structure Sans Abonnement" })).toBeVisible();
  await expect(page.getByText("Non activé").first()).toBeVisible();
  await expect(page.getByText("Votre espace professionnel est prêt.")).toBeVisible();
  await expect(card(page, "Candidats actifs")).toContainText("0 / 10");
  await expect(card(page, "Documents utilisés")).toContainText("— / 30");
  await expect(card(page, "Documents disponibles")).toContainText("0");
  // Période de 30 jours, comme dans les CGU Pro (pas « par mois »), et un
  // bouton verrouillé qui en donne la vraie raison.
  await expect(card(page, "Abonnement")).toContainText("5 000 FCFA / 30 jours");
  await expect(page.getByText("/ mois")).toHaveCount(0);
  await expect(page.getByText("Abonnement requis")).toBeVisible();
  // L'en-tête et le pied de page du site particulier ne sont pas affichés.
  await expect(page.locator("footer")).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test("abonnement actif : chiffres réels (7/10, 18/30, 12 disponibles)", async ({ page, context }) => {
  const pro = await createProUser("Structure Active");
  await period(pro.accountId, -5, 18);
  await candidates(pro.accountId, 7, 3);
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");

  await expect(page.getByText("Actif", { exact: true }).first()).toBeVisible();
  await expect(card(page, "Candidats actifs")).toContainText("7 / 10");
  await expect(card(page, "Documents utilisés")).toContainText("18 / 30");
  await expect(card(page, "Documents disponibles")).toContainText("12");
  await expect(page.getByText("Sans renouvellement automatique", { exact: false })).toBeVisible();
  await expect(page.getByText("Vous approchez", { exact: false })).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test("proche de la limite, puis limite atteinte", async ({ page, context }) => {
  const near = await createProUser("Structure Presque Pleine");
  await period(near.accountId, -1, 25);
  await candidates(near.accountId, 8);
  await loginAs(context, near.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByText("Vous approchez de votre limite mensuelle.")).toBeVisible();
  await expect(page.getByText("Vous approchez de la limite de 10 candidats actifs.")).toBeVisible();

  const full = await createProUser("Structure Pleine");
  await period(full.accountId, -1, 30);
  await candidates(full.accountId, 10);
  await context.clearCookies();
  await loginAs(context, full.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByText("Votre quota mensuel est atteint.", { exact: false })).toBeVisible();
  await expect(page.getByText("Consultez votre abonnement pour plus d'informations.", { exact: false })).toBeVisible();
  await expect(page.getByText("Limite de 10 candidats actifs atteinte.", { exact: false })).toBeVisible();
  await expect(card(page, "Documents disponibles")).toContainText("0");
});

test("renouvellement anticipé : l'accès court jusqu'à la fin de la période suivante", async ({ page, context }) => {
  const pro = await createProUser("Structure Renouvelée");
  const first = await period(pro.accountId, -20, 4); // fin dans 10 jours
  // Période suivante accolée exactement à la fin de la première (comme le
  // fera le renouvellement réel, phase 8) : fin dans 40 jours.
  const next = await period(pro.accountId, first.expiresAt);
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  const end = next.expiresAt.toLocaleDateString("fr", { day: "numeric", month: "long", year: "numeric" });
  await expect(page.getByText(`Votre accès Pro reste actif jusqu'au ${end}.`, { exact: false })).toBeVisible();
  await expect(card(page, "Documents utilisés")).toContainText("4 / 30");
});

test("expiré : lecture seule annoncée, date de suppression à +90 jours", async ({ page, context }) => {
  const pro = await createProUser("Structure Expirée");
  await period(pro.accountId, -40); // expirée depuis 10 jours
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByText("Votre abonnement Pro Starter a expiré.")).toBeVisible();
  const deletion = new Date(Date.now() + 80 * DAY).toLocaleDateString("fr", { day: "numeric", month: "long", year: "numeric" });
  await expect(page.getByText(`consultables et téléchargeables jusqu'au ${deletion}`, { exact: false })).toBeVisible();
  await expect(card(page, "Documents utilisés")).toContainText("— / 30");
});

test("isolation : chaque structure ne voit que ses propres chiffres", async ({ browser }) => {
  const a = await createProUser("Structure A");
  await period(a.accountId, -2, 9);
  await candidates(a.accountId, 6);
  const b = await createProUser("Structure B");

  const contextB = await browser.newContext({ baseURL: BASE_URL });
  await loginAs(contextB, b.userId, BASE_URL);
  const page = await contextB.newPage();
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByRole("heading", { name: "Bonjour, Structure B" })).toBeVisible();
  await expect(card(page, "Candidats actifs")).toContainText("0 / 10");
  await expect(card(page, "Documents utilisés")).toContainText("— / 30");
  await expect(page.getByText("Structure A")).toHaveCount(0);
  await contextB.close();
});

test("navigation : rubriques pas encore construites grisées, menu mobile", async ({ page, context, isMobile }) => {
  const pro = await createProUser("Structure Navigation");
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");

  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  const nav = page.getByRole("navigation", { name: "Espace professionnel" }).filter({ visible: true });
  await expect(nav.getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Aide" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Mes candidats" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Nouveau candidat" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Documents" })).toBeVisible();
  for (const label of ["Mon abonnement", "Paramètres"]) {
    await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
    await expect(nav.getByText(label, { exact: true })).toBeVisible();
  }
  await nav.getByRole("link", { name: "Aide" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/aide$/);
  await expect(page.getByRole("heading", { name: "Aide" })).toBeVisible();
  await expect(page.getByRole("link", { name: "monemploigo.contact@gmail.com" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});
