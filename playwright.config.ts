import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

fs.mkdirSync(path.join(__dirname, "e2e", ".outbox"), { recursive: true });

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
 * Base de données : celle de .env.local / .env. Les tests qui écrivent en
 * base refusent de tourner si c'est la production (voir e2e/db.ts).
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
    // E-mails écrits dans e2e/.outbox au lieu d'être envoyés (voir mailer.ts).
    env: { PRO_ENABLED, PAYMENT_MODE: "mock", E2E_EMAIL_OUTBOX: path.join(__dirname, "e2e", ".outbox", "emails.jsonl") },
  },
});
