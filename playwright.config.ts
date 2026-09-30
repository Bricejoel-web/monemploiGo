import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (MonEmploiGo Pro, phases 0 à 12 — voir
 * docs/ROADMAP.md). Lancement : `npm run test:e2e` (Pro activé) ou
 * `npm run test:e2e:pro-off` (Pro désactivé, ce que voit la production tant
 * que Pro n'est pas lancé).
 *
 * Le site est construit puis servi en mode production sur le port 3100 :
 * les pages légales sont générées à la construction, donc l'interrupteur
 * PRO_ENABLED doit être fixé AVANT le build (d'où un build par lancement).
 * Un serveur déjà ouvert sur ce port est réutilisé : il doit alors avoir été
 * construit avec la même valeur de PRO_ENABLED.
 *
 * Sécurité : paiement toujours simulé (jamais d'appel au vrai Notch Pay).
 * ⚠️ La base de données est celle de .env : tant qu'elle pointe vers la
 * production, aucun test ne doit écrire en base.
 *
 * Navigateur : le Chrome installé sur la machine (pas de téléchargement).
 */
const PORT = 3100;
const PRO_ENABLED = process.env.PRO_ENABLED ?? "true";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    timeout: 10 * 60_000,
    reuseExistingServer: true,
    env: { PRO_ENABLED, PAYMENT_MODE: "mock" },
  },
});
