// Lance les tests du mode maintenance avec un serveur démarré en maintenance
// (MAINTENANCE_MODE=true), comme e2e/pro-off.mjs pour les interrupteurs.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["playwright", "test", "e2e/maintenance.spec.ts", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MAINTENANCE_MODE: "true" },
});
process.exit(result.status ?? 1);
