import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnvironment } from "../config";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function getPostgres() {
  if (globalDb.prisma) return globalDb.prisma;
  const { DATABASE_URL: connectionString } = getServerEnvironment();
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 5000, max: 5 });
  globalDb.prisma = new PrismaClient({ adapter });
  return globalDb.prisma;
}
