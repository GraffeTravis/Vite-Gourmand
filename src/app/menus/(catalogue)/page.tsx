import type { Metadata } from "next";
import { getPostgres } from "@/server/db/postgres";
import { getServerEnvironment } from "@/server/config";
import { parseCatalogFilters } from "@/modules/menus/domain/filters";
import type { CatalogPage } from "@/modules/menus/domain/catalogue";
import { readCatalog } from "@/modules/menus/server/catalogue";
import { CatalogBrowser } from "@/modules/menus/components/CatalogBrowser";
export const metadata: Metadata = { title: "Tous les menus" };

export const dynamic = "force-dynamic";

export default async function MenusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) parameters.append(key, item);
  }
  const parsed = parseCatalogFilters(parameters);
  let data: CatalogPage | null = null;
  let error: string | null = parsed.success ? null : parsed.message;
  if (parsed.success) {
    try { data = await readCatalog(getPostgres(), parsed.data, getServerEnvironment().APP_ENV !== "production"); }
    catch { error = "Le catalogue est temporairement indisponible. Réessayez dans un instant."; }
  }
  return <section className="container page catalog-page"><div className="catalog-intro"><p className="eyebrow">LA CUISINE À PARTAGER</p><h1>À chaque occasion, son menu.</h1><p>Choisissez les saveurs qui vous ressemblent. Prix par personne et minimum de convives indiqués.</p></div><CatalogBrowser initialData={data} initialQuery={parameters.toString()} initialError={error} /></section>;
}
