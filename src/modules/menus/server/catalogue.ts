import "server-only";
import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { CATALOG_PAGE_SIZE, effectiveMaximum, type CatalogFilters } from "../domain/filters";
import { isSafeMenuImage, type CatalogPage, type MenuDetail } from "../domain/catalogue";

const summarySelect = {
  id: true, title: true, description: true, price: true, minimumNumberPeople: true, stock: true, isDemo: true,
  theme: { select: { label: true } }, diet: { select: { label: true } },
  menuImageByMenuId: { select: { id: true, uri: true, altText: true }, orderBy: [{ displayOrder: "asc" }, { id: "asc" }] },
} satisfies Prisma.MenuSelect;

export function publicMenuWhere(includeDemo = false): Prisma.MenuWhereInput {
  return {
    isActive: true,
    ...(includeDemo ? {} : { isDemo: false }),
    menuImageByMenuId: { some: {} },
    menuFoodByMenuId: { some: {}, every: { food: { allergensVerified: true } } },
  };
}

function toSummary(row: Prisma.MenuGetPayload<{ select: typeof summarySelect }>) {
  return {
    id: row.id, title: row.title, description: row.description, price: row.price.toFixed(2),
    minimumPeople: row.minimumNumberPeople, stock: row.stock, theme: row.theme.label, diet: row.diet.label, isDemo: row.isDemo,
    images: row.menuImageByMenuId.filter((image) => isSafeMenuImage(image.uri)),
  };
}

export async function readCatalog(db: PrismaClient, filters: CatalogFilters, includeDemo = false): Promise<CatalogPage> {
  const maximum = effectiveMaximum(filters);
  const where: Prisma.MenuWhereInput = {
    ...publicMenuWhere(includeDemo),
    ...(filters.theme ? { themeId: filters.theme } : {}),
    ...(filters.diet ? { dietId: filters.diet } : {}),
    ...(filters.people ? { minimumNumberPeople: { lte: filters.people } } : {}),
    ...((filters.priceMin !== undefined || maximum !== undefined) ? { price: { gte: filters.priceMin, lte: maximum } } : {}),
  };
  const { total, rows, themes, diets } = await db.$transaction(async (tx) => {
    const total = await tx.menu.count({ where });
    const rows = await tx.menu.findMany({ where, select: summarySelect, orderBy: [{ title: "asc" }, { id: "asc" }], take: CATALOG_PAGE_SIZE, skip: (filters.page - 1) * CATALOG_PAGE_SIZE });
    const themes = await tx.theme.findMany({ where: { menuByThemeId: { some: publicMenuWhere(includeDemo) } }, select: { id: true, label: true }, orderBy: [{ label: "asc" }, { id: "asc" }] });
    const diets = await tx.diet.findMany({ where: { menuByDietId: { some: publicMenuWhere(includeDemo) } }, select: { id: true, label: true }, orderBy: [{ label: "asc" }, { id: "asc" }] });
    return { total, rows, themes, diets };
  }, { isolationLevel: "RepeatableRead" });
  return { menus: rows.map(toSummary), total, page: filters.page, pageCount: Math.ceil(total / CATALOG_PAGE_SIZE), themes, diets };
}

export async function readMenuDetail(db: PrismaClient, id: number, includeDemo = false): Promise<MenuDetail | null> {
  const row = await db.menu.findFirst({ where: { ...publicMenuWhere(includeDemo), id }, select: {
    ...summarySelect,
    commandConditions: true,
    menuFoodByMenuId: { orderBy: [{ displayOrder: "asc" }, { foodId: "asc" }], select: {
      food: { select: { id: true, name: true, description: true, category: true,
        foodAllergenByFoodId: { select: { allergen: { select: { label: true } } }, orderBy: { allergen: { label: "asc" } } },
      } },
    } },
  } });
  if (!row) return null;
  return { ...toSummary(row), conditions: row.commandConditions, foods: row.menuFoodByMenuId.map(({ food }) => ({
    id: food.id, name: food.name, description: food.description, category: food.category,
    allergens: food.foodAllergenByFoodId.map(({ allergen }) => allergen.label),
  })) };
}
