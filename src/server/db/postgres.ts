import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnvironment } from "../config";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function getPostgres() {
  if (globalDb.prisma) return globalDb.prisma;
  const { DATABASE_URL: connectionString } = getServerEnvironment();
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 5000, max: 5 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  const adapter = new PrismaPg(pool, { disposeExternalPool: true });
  globalDb.prisma = new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 15_000 } });
  return globalDb.prisma;
}
