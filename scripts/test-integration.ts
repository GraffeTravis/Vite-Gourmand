import { withTestDatabase } from "./test-database";

await withTestDatabase(async (run) => {
  await run("node_modules/vitest/vitest.mjs", ["run", "--config", "vitest.integration.config.ts", ...process.argv.slice(2)]);
});
