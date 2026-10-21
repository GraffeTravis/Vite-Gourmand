import { fileURLToPath } from "node:url";
import nextEnvironment from "@next/env";
import { readServerEnvironment } from "../src/server/config/environment";

const command = process.argv[2];
if (command !== "dev" && command !== "start") throw new Error("Commande Next.js invalide");
nextEnvironment.loadEnvConfig(process.cwd(), command === "dev");

try {
  readServerEnvironment(process.env);
  const entrypoint = new URL("../node_modules/next/dist/bin/next", import.meta.url);
  process.argv = [process.execPath, fileURLToPath(entrypoint), command, ...process.argv.slice(3)];
  // Même processus : les signaux et la sortie ne laissent pas de serveur enfant orphelin.
  await import(entrypoint.href);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Configuration serveur invalide");
  process.exitCode = 1;
}
