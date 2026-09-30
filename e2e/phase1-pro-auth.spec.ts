import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, gotoReady, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, dbWritesAllowed, deleteTestUsers, lastEmailTo, testDb, testEmail } from "./db";

// Phase 1 (MonEmploiGo Pro) : compte professionnel, inscription, connexion,
// mot de passe oublié. Première partie : pages et protections (lecture
// seule). Seconde partie : parcours complets, qui créent des comptes — elle
// ne tourne que sur une base de développement (voir e2e/db.ts).

const PASSWORD = "Pro-Test#2026";
const NEW_PASSWORD = "Nouveau-Pass#2026";

test.describe("pages de connexion et protections", () => {
  test.skip(!proEnabled, "Pro désactivé");

  test("inscription Pro : champs, double acceptation des CGU, noindex", async ({ page }) => {
    const response = await gotoReady(page, "/fr/pro/inscription");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    for (const label of ["Nom de la structure *", "Nom du responsable *", "E-mail professionnel *", "Téléphone *", "Mot de passe *", "Confirmer le mot de passe"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
    const terms = page.locator("label").filter({ has: page.locator('input[name="terms"]') });
    await expect(terms.getByRole("link", { name: "Conditions générales d'utilisation de MonEmploiGo" })).toHaveAttribute("href", "/fr/conditions-utilisation");
    await expect(terms.getByRole("link", { name: "Conditions d'utilisation de MonEmploiGo Pro" })).toHaveAttribute("href", "/fr/pro/conditions-utilisation");
    await expect(page.getByRole("button", { name: "Créer mon espace professionnel" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("connexion Pro : boutons attendus, noindex", async ({ page }) => {
    const response = await page.goto("/fr/pro/connexion");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute("href", "/fr/mot-de-passe-oublie?espace=pro");
    await expect(page.getByRole("link", { name: "Créer un espace professionnel" })).toHaveAttribute("href", "/fr/pro/inscription");
    await expectNoHorizontalScroll(page);
  });

  test("pages Pro privées : connexion obligatoire", async ({ page }) => {
    for (const path of ["/fr/pro/dashboard", "/fr/pro/candidats", "/en/pro/dashboard"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/fr\/pro\/connexion$/);
    }
  });

  test("particuliers : lien « mot de passe oublié » sur la connexion", async ({ page }) => {
    await page.goto("/fr/connexion");
    await expect(page.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute("href", "/fr/mot-de-passe-oublie");
    await page.goto("/en/connexion");
    await expect(page.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/en/mot-de-passe-oublie");
  });

  test("mot de passe oublié : même réponse pour une adresse inconnue", async ({ page, isMobile }) => {
    // Une seule demande (limite : 5 demandes par quart d'heure et par adresse IP).
    test.skip(isMobile, "joué une fois, sur ordinateur");
    const response = await gotoReady(page, "/fr/mot-de-passe-oublie");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await page.getByLabel("Adresse e-mail").fill("personne-inconnue-e2e@example.com");
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    // Première requête à la base après démarrage : Neon peut mettre quelques secondes à se réveiller.
    await expect(page.getByText("Si un compte existe avec cette adresse", { exact: false })).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalScroll(page);
  });

  test("lien de réinitialisation invalide", async ({ page }) => {
    // Lit la table des liens, qui n'existe qu'une fois la migration appliquée.
    test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
    await page.goto("/fr/reinitialiser-mot-de-passe?token=lien-invente-qui-nexiste-pas-du-tout");
    await expect(page.getByText("Ce lien n'est plus valable", { exact: false })).toBeVisible();
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  });
});

// ---------------------------------------------------------------------------

async function fillSpace(page: Page, { company, email }: { company: string; email?: string }) {
  await page.getByLabel("Nom de la structure *").fill(company);
  await page.getByLabel("Nom du responsable *").fill("Responsable Test");
  if (email) await page.getByLabel("E-mail professionnel *").fill(email);
  await page.getByLabel("Téléphone *").fill("+237 600 00 00 00");
}

async function signupPro(page: Page, email: string, company: string) {
  await gotoReady(page, "/fr/pro/inscription");
  await fillSpace(page, { company, email });
  await page.getByLabel("Mot de passe *", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmer le mot de passe").fill(PASSWORD);
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "Créer mon espace professionnel" }).click();
}

async function loginPro(page: Page, email: string, password: string) {
  await gotoReady(page, "/fr/pro/connexion");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe("parcours complets (base de développement)", () => {
  test.skip(!proEnabled, "Pro désactivé");
  test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
  // Une seule fois (pas en double sur mobile) : limites de tentatives par IP.
  test.skip(({ isMobile }) => isMobile, "parcours joués une fois, sur ordinateur");
  test.describe.configure({ mode: "serial" });
  test.afterAll(deleteTestUsers);

  const proEmail = testEmail("pro");
  const company = `Structure E2E ${Date.now()}`;

  test("inscription Pro → espace créé avec les versions des CGU", async ({ page }) => {
    await signupPro(page, proEmail, company);
    await expect(page).toHaveURL(/\/fr\/pro\/dashboard$/);
    await expect(page.getByRole("heading", { name: `Bonjour, ${company}` })).toBeVisible();
    await expect(page.getByText("Votre espace professionnel est prêt.")).toBeVisible();
    await expectNoHorizontalScroll(page);

    const account = await testDb().professionalAccount.findFirst({ where: { user: { email: proEmail } } });
    expect(account?.companyName).toBe(company);
    expect(account?.termsVersion).toBeTruthy();
    expect(account?.proTermsVersion).toBeTruthy();
  });

  test("même e-mail (majuscules comprises) : pas de doublon, proposition de connexion", async ({ page }) => {
    await signupPro(page, proEmail.toUpperCase(), "Autre structure");
    await expect(page.getByText("Un compte MonEmploiGo existe déjà avec cette adresse e-mail.")).toBeVisible();
    await expect(page.getByRole("alert").getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/fr/pro/connexion");
    expect(await testDb().user.count({ where: { email: { equals: proEmail, mode: "insensitive" } } })).toBe(1);
  });

  test("connexion Pro : mauvais mot de passe refusé, bon mot de passe accepté", async ({ page }) => {
    await loginPro(page, proEmail, "mauvais-mot-de-passe");
    await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
    await loginPro(page, proEmail, PASSWORD);
    await expect(page).toHaveURL(/\/fr\/pro\/dashboard$/);
    await page.getByRole("main").getByRole("button", { name: "Déconnexion" }).click();
    await expect(page).toHaveURL(/\/fr\/pro\/connexion$/);
    await page.goto("/fr/pro/dashboard");
    await expect(page).toHaveURL(/\/fr\/pro\/connexion$/);
  });

  test("compte particulier existant → création de l'espace Pro sur le même compte", async ({ page }) => {
    const email = testEmail("particulier");
    await gotoReady(page, "/fr/inscription");
    await page.getByLabel("Prénom").fill("Jean");
    await page.getByLabel("Nom", { exact: true }).fill("Test");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirmer le mot de passe").fill(PASSWORD);
    await page.locator('input[name="terms"]').check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);

    await gotoReady(page, "/fr/pro/connexion");
    await expect(page).toHaveURL(/\/fr\/pro\/inscription$/);
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByLabel("E-mail professionnel *")).toHaveValue(email);
    await fillSpace(page, { company: "Espace ajouté" });
    await page.locator('input[name="terms"]').check();
    await page.getByRole("button", { name: "Créer mon espace professionnel" }).click();
    await expect(page).toHaveURL(/\/fr\/pro\/dashboard$/);

    expect(await testDb().user.count({ where: { email } })).toBe(1);
    // L'espace particulier reste accessible et séparé.
    await page.goto("/fr/tableau-de-bord");
    await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
  });

  test("mot de passe oublié (Pro) : lien unique, 1 heure, ancien mot de passe refusé", async ({ page }) => {
    await gotoReady(page, "/fr/mot-de-passe-oublie?espace=pro");
    await page.getByLabel("Adresse e-mail").fill(proEmail);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    // Première requête à la base après démarrage : Neon peut mettre quelques secondes à se réveiller.
    await expect(page.getByText("Si un compte existe avec cette adresse", { exact: false })).toBeVisible({ timeout: 20_000 });

    await expect.poll(() => lastEmailTo(proEmail)?.subject).toBe("Réinitialisation de votre mot de passe monemploiGo");
    const link = lastEmailTo(proEmail)!.text.match(/https?:\/\/\S+reinitialiser-mot-de-passe\?\S+/)![0];
    const resetPath = new URL(link).pathname + new URL(link).search;
    expect(resetPath).toContain("espace=pro");

    await gotoReady(page, resetPath);
    await page.getByLabel("Nouveau mot de passe").fill(NEW_PASSWORD);
    await page.getByLabel("Confirmer le mot de passe").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();
    await expect(page).toHaveURL(/\/fr\/pro\/connexion\?reinitialise=1$/);
    await expect(page.getByText("Votre mot de passe a été modifié.", { exact: false })).toBeVisible();

    // Lien déjà utilisé.
    await gotoReady(page, resetPath);
    await expect(page.getByText("Ce lien n'est plus valable", { exact: false })).toBeVisible();

    await loginPro(page, proEmail, PASSWORD);
    await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
    await loginPro(page, proEmail, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/fr\/pro\/dashboard$/);
  });

  test("lien de réinitialisation expiré", async ({ page }) => {
    await gotoReady(page, "/fr/mot-de-passe-oublie?espace=pro");
    await page.getByLabel("Adresse e-mail").fill(proEmail);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    // Première requête à la base après démarrage : Neon peut mettre quelques secondes à se réveiller.
    await expect(page.getByText("Si un compte existe avec cette adresse", { exact: false })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => lastEmailTo(proEmail)?.text.match(/token=([\w-]+)/)?.[1]).toBeTruthy();
    const link = lastEmailTo(proEmail)!.text.match(/https?:\/\/\S+reinitialiser-mot-de-passe\?\S+/)![0];

    // On vieillit le lien de plus d'une heure.
    await testDb().passwordResetToken.updateMany({
      where: { user: { email: proEmail }, usedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await page.goto(new URL(link).pathname + new URL(link).search);
    await expect(page.getByText("Ce lien n'est plus valable", { exact: false })).toBeVisible();
  });
});
