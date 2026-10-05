import "server-only";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Le pilote Neon utilise WebSocket pour les transactions/requêtes interactives
// en environnement Node.js (contrairement au runtime Edge, qui a déjà accès à
// WebSocket nativement) — voir la documentation Neon "Serverless driver".
neonConfig.webSocketConstructor = ws;

// En développement, Next.js recharge les modules à chaud : on garde une seule
// instance de PrismaClient sur `globalThis` pour éviter d'ouvrir une nouvelle
// connexion à la base à chaque rechargement.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  // Délais de toutes les transactions. Ceux de Prisma par défaut (2 s pour
  // démarrer, 5 s pour aboutir) ne couvrent pas le réveil d'une base Neon
  // en veille : P2028 « Unable to start a transaction in the given time »
  // mesuré sur une réinitialisation de mot de passe, avec une page d'erreur
  // pour l'utilisateur. Même délais que les transactions sous verrou Pro.
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
