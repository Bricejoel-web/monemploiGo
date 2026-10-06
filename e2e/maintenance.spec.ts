import { expect, test } from "@playwright/test";

// Mode maintenance (src/lib/maintenance.ts) : lancé par `node e2e/maintenance.mjs`,
// qui démarre le serveur de test avec MAINTENANCE_MODE=true.
test.skip(process.env.MAINTENANCE_MODE !== "true", "mode maintenance éteint");
test.skip(({ isMobile }) => isMobile, "joué une fois, sur ordinateur");

test("tout est coupé : pages (FR/EN), actions et API répondent 503", async ({ request }) => {
  const fr = await request.get("/fr", { maxRedirects: 0 });
  expect(fr.status()).toBe(503);
  expect(fr.headers()["retry-after"]).toBe("3600");
  expect(await fr.text()).toContain("Site en maintenance");
  expect(await (await request.get("/en/cv")).text()).toContain("Site under maintenance");
  expect((await request.post("/fr/connexion", { data: "x" })).status()).toBe(503);
  expect((await request.get("/api/session")).status()).toBe(503);
  expect((await request.get("/api/cron/purge-documents", { headers: { Authorization: "Bearer e2e-cron-secret" } })).status()).toBe(503);
  expect((await request.post("/api/paiement/webhook/notchpay", { data: {} })).status()).toBe(503);
});

test("accès réservé : mauvais secret refusé, bon secret → ce navigateur seul utilise le site", async ({ page, browser }) => {
  expect((await page.goto("/fr?acces-maintenance=mauvais"))?.status()).toBe(503);
  await page.goto("/fr/cv?acces-maintenance=e2e-maintenance-secret");
  // Le secret disparaît de l'adresse ; le site fonctionne pour ce navigateur.
  await expect(page).toHaveURL(/\/fr\/cv$/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Site en maintenance");
  expect((await page.goto("/fr/etranger"))?.status()).toBe(200);
  const cookie = (await page.context().cookies()).find((c) => c.name === "monemploigo_maintenance");
  expect(cookie?.value).toMatch(/^[0-9a-f]{64}$/);
  expect(cookie?.value).not.toContain("e2e-maintenance-secret");

  // Un autre navigateur reste bloqué.
  const other = await browser.newContext();
  expect((await (await other.newPage()).goto("/fr/cv"))?.status()).toBe(503);
  await other.close();
});
