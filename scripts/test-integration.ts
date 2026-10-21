import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.test", quiet: true });
const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("TEST_DATABASE_ADMIN_URL requise : voir .env.test.example. Aucun recours à DATABASE_URL.");
const databaseName = `vg_test_${randomUUID().replaceAll("-", "")}`;
const isolatedUrl = new URL(adminUrl);
isolatedUrl.pathname = `/${databaseName}`;
// Une base neuve par exécution, créée puis supprimée par ce processus uniquement.
const admin = new Client({ connectionString: adminUrl, connectionTimeoutMillis: 5000 });
const childEnvironment = { ...process.env, APP_ENV: "test", DATABASE_URL: isolatedUrl.href, TEST_DATABASE_URL: isolatedUrl.href };

function run(script: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { env: childEnvironment, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Étape de test échouée (${code ?? signal})`)));
  });
}

await admin.connect();
let created = false;
try {
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  // Vérifie aussi la réexécution des migrations sans modification ni perte.
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  await run("node_modules/vitest/vitest.mjs", ["run", "--config", "vitest.integration.config.ts", ...process.argv.slice(2)]);
} finally {
  try {
    if (created) {
      // Le nom est généré ci-dessus, jamais tiré d'une URL fournie par l'utilisateur.
      await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
}
