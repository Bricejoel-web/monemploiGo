import { expect, type Page } from "@playwright/test";

/** Même valeur que celle transmise au serveur (voir playwright.config.ts). */
export const proEnabled = (process.env.PRO_ENABLED ?? "true") === "true";

/** Ouvre une page et attend qu'elle soit entièrement chargée (formulaires actifs). */
export async function gotoReady(page: Page, path: string) {
  const response = await page.goto(path);
  await page.waitForLoadState("networkidle");
  return response;
}

/** Aucun défilement horizontal involontaire (affichage mobile notamment). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "défilement horizontal involontaire").toBeLessThanOrEqual(0);
}

/** Parrainage activé côté serveur de test (voir playwright.config.ts). */
export const referralEnabled = (process.env.REFERRAL_ENABLED ?? "true") === "true";
