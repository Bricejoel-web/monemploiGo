import path from "node:path";
import fs from "node:fs";
import { defineConfig, env } from "prisma/config";

// La CLI Prisma ne charge pas .env avant d'évaluer ce fichier : on le fait
// nous-mêmes avec l'API native de Node (disponible depuis Node 20.6).
// .env.local d'abord, comme Next.js : il désigne la base de développement
// (branche Neon « dev ») et ne doit jamais être masqué par .env, qui pointe
// vers la production. loadEnvFile ne remplace pas une variable déjà définie.
for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(path.join(__dirname, file))) {
    process.loadEnvFile(path.join(__dirname, file));
  }
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  // Migrations passent par une connexion Postgres non poolée (Neon) : le
  // pooler (mode transaction) ne supporte pas certaines commandes DDL/session
  // utilisées par `prisma migrate`. Le runtime applicatif (src/lib/db/client.ts)
  // utilise lui la connexion poolée (DATABASE_URL), adaptée au grand nombre de
  // connexions courtes d'un environnement serverless.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
