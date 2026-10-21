import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedReferenceData } from "./reference-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 10_000 }),
  transactionOptions: { maxWait: 10_000, timeout: 15_000 },
});
try {
  await seedReferenceData(prisma);
  console.info("Référentiels initialisés. Aucun compte ni contenu fictif créé.");
} finally {
  await prisma.$disconnect();
}
