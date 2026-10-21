import { getPostgres } from "@/server/db/postgres";
import { getServerEnvironment } from "@/server/config";
import { parseCatalogFilters } from "@/modules/menus/domain/filters";
import { readCatalog } from "@/modules/menus/server/catalogue";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const parsed = parseCatalogFilters(new URL(request.url).searchParams);
  if (!parsed.success) return Response.json({ message: parsed.message }, { status: 400, headers });
  try {
    return Response.json(await readCatalog(getPostgres(), parsed.data, getServerEnvironment().APP_ENV !== "production"), { headers });
  } catch {
    return Response.json({ message: "Le catalogue est temporairement indisponible. Réessayez dans un instant." }, { status: 503, headers });
  }
}
