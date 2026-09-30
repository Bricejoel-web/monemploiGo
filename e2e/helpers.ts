import { expect, type Page } from "@playwright/test";

/** Même valeur que celle transmise au serveur (voir playwright.config.ts). */
export const proEnabled = (process.env.PRO_ENABLED ?? "true") === "true";

/** Aucun défilement horizontal involontaire (affichage mobile notamment). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "défilement horizontal involontaire").toBeLessThanOrEqual(0);
}
