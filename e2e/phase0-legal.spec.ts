import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, proEnabled, referralEnabled } from "./helpers";

// Phase 0 (MonEmploiGo Pro) : textes juridiques. Vérifie que les pages
// légales existantes sont intactes, que les CGU Pro et la section Pro de la
// politique de confidentialité n'existent que lorsque Pro est activé, et que
// leurs liens fonctionnent. Lecture seule : aucune écriture en base.

const EXISTING = [
  { path: "/fr/conditions-utilisation", title: "Conditions générales d'utilisation — MonEmploiGo", sections: 27 },
  { path: "/en/conditions-utilisation", title: "Terms of Use — MonEmploiGo", sections: 27 },
  { path: "/fr/confidentialite", title: "Politique de confidentialité — MonEmploiGo", sections: 29, proHeading: "8 bis. MonEmploiGo Pro", referralHeading: "8 ter. Parrainage" },
  { path: "/en/confidentialite", title: "Privacy Policy — MonEmploiGo", sections: 29, proHeading: "8a. MonEmploiGo Pro", referralHeading: "8b. Referral programme" },
  { path: "/fr/mentions-legales" },
  { path: "/fr/cookies" },
];

test.describe("pages légales existantes", () => {
  for (const page of EXISTING) {
    test(`${page.path} reste accessible`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      expect(response?.status()).toBe(200);
      if (page.title) await expect(p.locator("h1")).toHaveText(page.title);
      if (page.sections) {
        const expected = page.sections + (page.proHeading && proEnabled ? 1 : 0) + (page.referralHeading && referralEnabled ? 1 : 0);
        await expect(p.locator("main h2")).toHaveCount(expected);
      }
      if (page.proHeading) {
        await expect(p.getByRole("heading", { name: page.proHeading })).toHaveCount(proEnabled ? 1 : 0);
      }
      if (page.referralHeading) {
        await expect(p.getByRole("heading", { name: page.referralHeading })).toHaveCount(referralEnabled ? 1 : 0);
      }
      await expectNoHorizontalScroll(p);
    });
  }

  test("la date de la politique de confidentialité suit la version publiée", async ({ page }) => {
    await page.goto("/fr/confidentialite");
    const date = referralEnabled ? "6 octobre 2026" : proEnabled ? "30 septembre 2026" : "29 septembre 2026";
    // En haut de la page et dans « 29. Entrée en vigueur ».
    await expect(page.getByText(`Dernière mise à jour : ${date}`)).toHaveCount(2);
  });

  test("les liens légaux du pied de page fonctionnent", async ({ page }) => {
    await page.goto("/fr");
    const footer = page.locator("footer");
    const hrefs = await footer.locator("a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    for (const href of ["/fr/mentions-legales", "/fr/confidentialite", "/fr/conditions-utilisation", "/fr/cookies"]) {
      expect(hrefs).toContain(href);
      expect((await page.request.get(href)).status(), href).toBe(200);
    }
    expect(hrefs.includes("/fr/pro/conditions-utilisation")).toBe(proEnabled);
  });
});

test.describe("CGU Pro", () => {
  test.skip(!proEnabled, "Pro désactivé");

  test("accessibles, complètes et liées aux textes généraux", async ({ page }) => {
    const response = await page.goto("/fr/pro/conditions-utilisation");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Conditions d'utilisation de MonEmploiGo Pro");
    await expect(page.locator("main h2")).toHaveCount(18);
    await expect(page.getByRole("heading", { name: "12. Remboursement" })).toBeVisible();
    await expect(page.getByText("Pro Starter coûte 5 000 FCFA (XAF) par période de 30 jours.")).toBeVisible();
    await expect(page.getByText("L'abonnement n'est pas renouvelé automatiquement.", { exact: false })).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Page en français uniquement : aucune version anglaise déclarée.
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);

    await page.getByRole("link", { name: "Conditions générales d'utilisation de MonEmploiGo" }).click();
    await expect(page).toHaveURL(/\/fr\/conditions-utilisation$/);
    await page.goBack();
    await page.getByRole("link", { name: "Politique de confidentialité de MonEmploiGo" }).click();
    await expect(page).toHaveURL(/\/fr\/confidentialite$/);
  });

  test("la version anglaise redirige vers le français", async ({ page }) => {
    await page.goto("/en/pro/conditions-utilisation");
    await expect(page).toHaveURL(/\/fr\/pro\/conditions-utilisation$/);
    await expect(page.locator("h1")).toHaveText("Conditions d'utilisation de MonEmploiGo Pro");
  });
});

test.describe("Pro désactivé", () => {
  test.skip(proEnabled, "Pro activé");

  test("aucune page Pro n'est publiée", async ({ page }) => {
    for (const path of ["/fr/pro/conditions-utilisation", "/en/pro/conditions-utilisation", "/fr/pro", "/fr/pro/inscription", "/fr/pro/connexion", "/fr/pro/dashboard"]) {
      expect((await page.request.get(path)).status(), path).toBe(404);
    }
  });
});

test("les textes du parrainage n'existent que lorsque le parrainage est activé", async ({ page }) => {
  for (const path of ["/fr/conditions-parrainage", "/fr/recommandation", "/fr/parrainage"]) {
    const status = (await page.request.get(path, { maxRedirects: 0 })).status();
    if (referralEnabled) expect(status, path).not.toBe(404);
    else expect(status, path).toBe(404);
  }
  await page.goto("/fr/cookies");
  await expect(page.getByText("« monemploigo_ref »", { exact: false })).toHaveCount(referralEnabled ? 1 : 0);
});
