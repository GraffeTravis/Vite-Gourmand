import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export function localSeedClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL requise");
  const url = new URL(connectionString);
  if (!["development", "test"].includes(process.env.APP_ENV ?? "") || !["localhost", "127.0.0.1", "postgres"].includes(url.hostname) || !/^\/(vite_gourmand|vg_test_[a-f0-9]{32})$/.test(url.pathname)) {
    throw new Error("Cette initialisation est réservée aux bases locales de développement et de test.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
