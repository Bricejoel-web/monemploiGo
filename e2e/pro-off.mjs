// Lance les tests avec MonEmploiGo Pro désactivé (ce que voit la production
// tant que Pro n'est pas lancé), sans dépendance supplémentaire pour fixer
// la variable d'environnement sous Windows comme sous Linux/macOS.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PRO_ENABLED: "false" },
});
process.exit(result.status ?? 1);
