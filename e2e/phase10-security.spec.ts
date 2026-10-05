import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { gotoReady, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, createUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 10 (MonEmploiGo Pro) : sécurité. Sessions révocables, comptes
// supprimés ou suspendus, en-têtes de sécurité, accès croisés entre
// structures sur les nouvelles pages (abonnement, paramètres).

const BASE_URL = "http://localhost:3100";
const NEW_PASSWORD = "Nouveau-Mdp#2026";

test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.skip(({ isMobile }) => isMobile, "joué une fois, sur ordinateur");
test.afterAll(deleteTestUsers);
test.slow();

test("réinitialisation du mot de passe : les sessions des autres appareils sont fermées", async ({ browser }) => {
  const user = await createUser("Compte Réinitialisé");
  const otherDevice = await browser.newContext();
  await loginAs(otherDevice, user.userId, BASE_URL);
  const otherPage = await otherDevice.newPage();
  await otherPage.goto("/fr/tableau-de-bord");
  await expect(otherPage).toHaveURL(/\/fr\/tableau-de-bord$/);

  // Lien de réinitialisation valable (seule son empreinte est en base).
  const token = randomBytes(32).toString("base64url");
  await testDb().passwordResetToken.create({
    data: { userId: user.userId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const resetDevice = await browser.newContext();
  const resetPage = await resetDevice.newPage();
  await gotoReady(resetPage, `/fr/reinitialiser-mot-de-passe?token=${token}`);
  // Saisie revérifiée : un rendu tardif de la page peut vider les champs.
  await expect(async () => {
    await resetPage.getByLabel("Nouveau mot de passe").fill(NEW_PASSWORD);
    await resetPage.getByLabel("Confirmer le mot de passe").fill(NEW_PASSWORD);
    await expect(resetPage.getByLabel("Confirmer le mot de passe")).toHaveValue(NEW_PASSWORD);
    await expect(resetPage.getByLabel("Nouveau mot de passe")).toHaveValue(NEW_PASSWORD);
  }).toPass();
  await resetPage.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();
  await expect(resetPage).toHaveURL(/\/fr\/connexion\?reinitialise=1$/);
  expect((await testDb().user.findUniqueOrThrow({ where: { id: user.userId } })).sessionVersion).toBe(1);

  // L'ancienne session ne donne plus accès à rien.
  await otherPage.goto("/fr/tableau-de-bord");
  await expect(otherPage).toHaveURL(/\/fr\/connexion$/);

  // Une nouvelle connexion avec le nouveau mot de passe fonctionne et dure.
  await resetPage.getByLabel("E-mail").fill(user.email);
  await resetPage.getByLabel("Mot de passe", { exact: true }).fill(NEW_PASSWORD);
  await resetPage.getByRole("button", { name: "Se connecter" }).click();
  await expect(resetPage).toHaveURL(/\/fr\/tableau-de-bord$/);
  await resetPage.reload();
  await expect(resetPage).toHaveURL(/\/fr\/tableau-de-bord$/);
  await otherDevice.close();
  await resetDevice.close();
});

test("compte supprimé : son ancien cookie de session ne donne plus accès", async ({ page, context }) => {
  const user = await createUser("Compte Effacé");
  await loginAs(context, user.userId, BASE_URL);
  await page.goto("/fr/tableau-de-bord");
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
  await testDb().user.delete({ where: { id: user.userId } });
  await page.goto("/fr/tableau-de-bord");
  await expect(page).toHaveURL(/\/fr\/connexion$/);
});

test("espace Pro suspendu : abonnement et paramètres inaccessibles", async ({ page, context }) => {
  test.skip(!proEnabled, "Pro désactivé");
  const pro = await createProUser("Agence Suspendue");
  await testDb().professionalAccount.update({ where: { id: pro.accountId }, data: { status: "SUSPENDED" } });
  await loginAs(context, pro.userId, BASE_URL);
  for (const path of ["/fr/pro/abonnement", "/fr/pro/parametres", "/fr/pro/parametres/supprimer"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/fr\/pro\/connexion\?suspendu=1$/);
  }
  expect(await testDb().payment.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
});

test("pages Pro privées : connexion obligatoire, jamais indexées, en-têtes de sécurité", async ({ request }) => {
  test.skip(!proEnabled, "Pro désactivé");
  for (const path of ["/fr/pro/abonnement", "/fr/pro/parametres"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    expect(response.headers()["location"]).toContain("/fr/pro/connexion");
  }
  const page = await request.get("/fr/pro/connexion");
  const headers = page.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toBeTruthy();
});

test("en-tête : une seule ligne à 1 280 px, menu « Mon compte » pour une personne connectée", async ({ page, context }) => {
  const headerHeight = () => page.evaluate(() => document.querySelector("header > div")!.getBoundingClientRect().height);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/fr/etranger");
  expect(await headerHeight()).toBeLessThan(80);

  const user = await createUser("Menu Compte");
  await loginAs(context, user.userId, BASE_URL);
  await page.goto("/fr/etranger");
  expect(await headerHeight()).toBeLessThan(80);
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "Tableau de bord" })).toBeVisible();

  await header.getByRole("button", { name: "Mon compte" }).click();
  const menu = header.getByRole("menu");
  await expect(menu.getByText(user.email)).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Tableau de bord" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);

  await header.getByRole("button", { name: "Mon compte" }).click();
  await menu.getByRole("button", { name: "Déconnexion" }).click();
  await expect(header.getByRole("link", { name: "Connexion" })).toBeVisible();
});
