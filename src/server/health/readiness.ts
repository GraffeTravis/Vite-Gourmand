import { createHash, timingSafeEqual } from "node:crypto";

export function isReadinessAuthorized(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization.slice(7)), digest(secret));
}

export async function checkReadiness(postgres: () => Promise<unknown>, mongodb: () => Promise<unknown>) {
  const results = await Promise.allSettled([Promise.resolve().then(postgres), Promise.resolve().then(mongodb)]);
  const services = { postgres: results[0].status === "fulfilled", mongodb: results[1].status === "fulfilled" };
  return { status: services.postgres && services.mongodb ? "ready" : "unavailable", services };
}
