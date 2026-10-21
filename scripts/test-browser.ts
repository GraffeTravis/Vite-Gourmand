import { withTestDatabase } from "./test-database";

await withTestDatabase(async (run) => {
  await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed-demo.ts"]);
  await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed-business-hours.ts"]);
  await run("node_modules/next/dist/bin/next", ["build"]);
  await run("node_modules/@playwright/test/cli.js", ["test", ...process.argv.slice(2)]);
});
