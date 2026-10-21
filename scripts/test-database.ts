import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Client } from "pg";
import { config } from "dotenv";

type Run = (script: string, args: string[]) => Promise<void>;

export async function withTestDatabase(work: (run: Run) => Promise<void>) {
  config({ path: ".env.test", quiet: true });
  const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
  if (!adminUrl) throw new Error("TEST_DATABASE_ADMIN_URL requise : voir .env.test.example. Aucun recours à DATABASE_URL.");
  const databaseName = `vg_test_${randomUUID().replaceAll("-", "")}`;
  const isolatedUrl = new URL(adminUrl);
  isolatedUrl.pathname = `/${databaseName}`;
  const childEnvironment = {
    ...process.env, APP_ENV: "test", APP_URL: "http://127.0.0.1:3109",
    DATABASE_URL: isolatedUrl.href, TEST_DATABASE_URL: isolatedUrl.href,
    MONGODB_URI: "mongodb://127.0.0.1:27017", MONGODB_DATABASE: "vg_test_analytics",
    SMTP_HOST: "localhost", SMTP_PORT: "1025", SMTP_FROM: "Tests <test@example.test>",
  };
  const run: Run = (script, args) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { env: childEnvironment, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Étape de test échouée (${code ?? signal})`)));
  });
  const admin = new Client({ connectionString: adminUrl, connectionTimeoutMillis: 5000 });
  await admin.connect();
  let created = false;
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    await work(run);
  } finally {
    try {
      if (created) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    } finally { await admin.end(); }
  }
}
