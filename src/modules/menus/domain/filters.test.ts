import { describe, expect, it } from "vitest";
import { effectiveMaximum, parseCatalogFilters } from "./filters";
import { isSafeMenuImage } from "./catalogue";

describe("D13 — filtres du catalogue", () => {
  it("reste neutre sans filtre", () => {
    expect(parseCatalogFilters(new URLSearchParams())).toEqual({ success: true, data: { page: 1 } });
  });
  it("conserve chaque filtre combiné", () => {
    expect(parseCatalogFilters(new URLSearchParams("priceMin=10.50&priceMax=40&priceCap=30&people=12&theme=2&diet=3&page=2"))).toEqual({ success: true, data: { priceMin: "10.50", priceMax: "40", priceCap: "30", people: 12, theme: 2, diet: 3, page: 2 } });
  });
  it.each(["people=0", "people=-1", "people=1.5", "people=Infinity", "theme=1e3", "page=0", "page=9999999", "priceMin=-1", "priceCap=1.001", "priceMin=NaN", "priceCap=Infinity", "priceMax=NaN", "priceMin=30&priceMax=20", "priceMin=30&priceCap=20", "diet=2&diet=3"])("refuse %s", (query) => {
    expect(parseCatalogFilters(new URLSearchParams(query)).success).toBe(false);
  });
  it("accepte un plafond nul et ignore les paramètres de suivi", () => {
    expect(parseCatalogFilters(new URLSearchParams("priceCap=0&utm_source=test"))).toEqual({ success: true, data: { priceCap: "0", page: 1 } });
  });
  it("retient le plafond le plus restrictif", () => {
    expect(effectiveMaximum({ priceCap: "30", priceMax: "29.99", page: 1 })).toBe("29.99");
    expect(effectiveMaximum({ priceCap: "10.01", priceMax: "10.10", page: 1 })).toBe("10.01");
  });
});

describe("images du catalogue", () => {
  it.each(["/images/demo/convivial.jpg", "/images/menus/photo-1.webp"])("accepte %s", (uri) => expect(isSafeMenuImage(uri)).toBe(true));
  it.each(["javascript:alert(1)", "https://127.0.0.1/private", "//example.com/photo.jpg", "/images/../secret.jpg", "/images/photo.svg"])("refuse %s", (uri) => expect(isSafeMenuImage(uri)).toBe(false));
});
