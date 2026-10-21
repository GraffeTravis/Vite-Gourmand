import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnvironment from "@next/env";
import { getPostgres } from "../src/server/db/postgres";
import { closeAnalyticsConnection, getAnalyticsDatabase } from "../src/server/db/mongo";

nextEnvironment.loadEnvConfig(process.cwd(), true);
const roundtrip = process.argv.includes("--roundtrip");
if (roundtrip) {
  const localSql = ["localhost", "127.0.0.1", "postgres"].includes(new URL(process.env.DATABASE_URL ?? "").hostname);
  const isolatedSql = localSql || process.env.NEON_BRANCH?.startsWith("vg-setup-check-");
  if (process.env.APP_ENV !== "test" || !isolatedSql || !/^vg_setup_check_[a-z0-9]{1,23}$/.test(process.env.MONGODB_DATABASE ?? "")) {
    throw new Error("Les ecritures de controle exigent APP_ENV=test, une branche SQL de test et une base MongoDB vg_setup_check_*.");
  }
}
const postgres = getPostgres();

async function check(name: string, work: () => Promise<void>) {
  try {
    await work();
    console.log(`${name}: OK`);
  } catch (error) {
    // Les erreurs de fournisseurs peuvent contenir une URL ou un nom de compte.
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "number" ? `, code ${error.code}` : "";
    console.error(`${name}: ECHEC (${error instanceof Error ? error.name : "erreur inconnue"}${code})`);
    process.exitCode = 1;
  }
}

try {
  await check("PostgreSQL via Prisma", async () => {
    const rows = await postgres.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    assert.equal(rows[0]?.ok, 1);
    if (roundtrip) {
      const marker = randomUUID();
      await postgres.$transaction(async (tx) => {
        await tx.$executeRaw`CREATE TEMP TABLE vg_connection_probe (value TEXT NOT NULL) ON COMMIT DROP`;
        await tx.$executeRaw`INSERT INTO vg_connection_probe (value) VALUES (${marker})`;
        const saved = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM vg_connection_probe`;
        assert.equal(saved[0]?.value, marker);
      });
      console.log("PostgreSQL: ecriture et lecture transactionnelles OK, table temporaire supprimee");
    }
  });

  await check("MongoDB via connecteur applicatif", async () => {
    const database = await getAnalyticsDatabase();
    assert.equal((await database.command({ ping: 1 })).ok, 1);
    if (roundtrip) {
      const marker = randomUUID();
      const collection = database.collection<{ _id: string; createdAt: Date }>("_vg_connectivity_probes");
      try {
        await collection.insertOne({ _id: marker, createdAt: new Date() });
        assert.equal((await collection.findOne({ _id: marker }))?._id, marker);
      } finally {
        // Ne supprime que le document aléatoire créé par cette exécution.
        await collection.deleteOne({ _id: marker });
      }
      assert.equal(await collection.countDocuments({ _id: marker }), 0);
      console.log("MongoDB: ecriture et lecture OK, document de controle supprime");
    }
  });
} finally {
  const cleanup = await Promise.allSettled([postgres.$disconnect(), closeAnalyticsConnection()]);
  if (cleanup.some((result) => result.status === "rejected")) {
    console.error("Fermeture des connexions: ECHEC");
    process.exitCode = 1;
  }
}
