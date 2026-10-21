import { z } from "zod";

const moneyPattern = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;
const optionalMoney = z.string().regex(moneyPattern, "Saisissez un prix positif avec deux décimales au maximum.").optional();
const positiveInteger = z.string().regex(/^[1-9]\d{0,8}$/).transform(Number).pipe(z.number().int().max(2_147_483_647)).optional();
const filterSchema = z.object({
  priceCap: optionalMoney,
  priceMin: optionalMoney,
  priceMax: optionalMoney,
  theme: positiveInteger,
  diet: positiveInteger,
  people: positiveInteger,
  page: z.string().regex(/^[1-9]\d{0,5}$/).transform(Number).default(1),
}).superRefine((value, context) => {
  if ([value.priceMin, value.priceMax, value.priceCap].some((price) => price !== undefined && !moneyPattern.test(price))) return;
  const minimum = moneyInCents(value.priceMin ?? "0");
  for (const key of ["priceMax", "priceCap"] as const) {
    if (value[key] !== undefined && moneyInCents(value[key]) < minimum) {
      context.addIssue({ code: "custom", path: [key], message: "Le prix maximum doit être supérieur ou égal au prix minimum." });
    }
  }
});

export type CatalogFilters = z.infer<typeof filterSchema>;
export type FilterResult = { success: true; data: CatalogFilters } | { success: false; message: string };
export const CATALOG_PAGE_SIZE = 12;

function moneyInCents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function parseCatalogFilters(parameters: URLSearchParams): FilterResult {
  const input: Record<string, string> = {};
  for (const key of Object.keys(filterSchema.shape)) {
    if (parameters.getAll(key).length > 1) return { success: false, message: "Un filtre ne peut pas être répété dans l’adresse." };
    const value = parameters.get(key);
    if (value !== null && value !== "") input[key] = value;
  }
  const result = filterSchema.safeParse(input);
  return result.success ? result : { success: false, message: result.error.issues[0]?.message ?? "Les filtres sont invalides." };
}

export function effectiveMaximum(filters: CatalogFilters) {
  if (filters.priceCap === undefined) return filters.priceMax;
  if (filters.priceMax === undefined) return filters.priceCap;
  return moneyInCents(filters.priceCap) < moneyInCents(filters.priceMax) ? filters.priceCap : filters.priceMax;
}
