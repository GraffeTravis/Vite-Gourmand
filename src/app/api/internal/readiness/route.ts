import { getPostgres } from "@/server/db/postgres";
import { getAnalyticsDatabase } from "@/server/db/mongo";
import { checkReadiness, isReadinessAuthorized } from "@/server/health/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isReadinessAuthorized(request.headers.get("Authorization"), process.env.READINESS_SECRET)) {
    return new Response(null, { status: 404, headers });
  }
  const result = await checkReadiness(
    () => getPostgres().$queryRaw`SELECT 1`,
    async () => (await getAnalyticsDatabase()).command({ ping: 1 }),
  );
  return Response.json(result, { status: result.status === "ready" ? 200 : 503, headers });
}
