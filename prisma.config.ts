import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node node_modules/tsx/dist/cli.mjs prisma/seed.ts" },
  // Neon fournit une connexion directe pour les migrations, distincte du pool applicatif.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
});
