import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openFilters(page: Page) {
  await expect(page.getByRole("heading", { name: "Affiner les menus" })).toBeVisible();
  const toggle = page.getByRole("button", { name: "Afficher les filtres" });
  if (await toggle.isVisible()) await toggle.click();
}

test("catalogue combiné, résultat vide et réinitialisation sans rechargement complet", async ({ page }) => {
  await page.goto("/menus");
  await expect(page.locator(".menu-card")).toHaveCount(3);
  await openFilters(page);
  const marker = await page.evaluate(() => { const marker = crypto.randomUUID(); (window as Window & { catalogMarker?: string }).catalogMarker = marker; return marker; });
  await page.getByLabel("Nombre de convives").fill("8");
  await expect(page.locator(".menu-card")).toHaveCount(1);
  await expect(page.locator(".menu-card h2")).toHaveText("Menu du jardin");
  await page.getByLabel("Prix maximum par personne").fill("21");
  await expect(page.getByRole("heading", { name: "Aucun menu ne correspond à votre recherche" })).toBeVisible();
  await page.getByRole("button", { name: "Réinitialiser les filtres" }).click();
  await expect(page.locator(".menu-card")).toHaveCount(3);
  await page.getByLabel("Régime alimentaire").selectOption({ label: "Végétarien" });
  await expect(page.locator(".menu-card")).toHaveCount(1);
  expect(await page.evaluate(() => (window as Window & { catalogMarker?: string }).catalogMarker)).toBe(marker);
});

test("fiche, galerie et retour au catalogue filtré", async ({ page }) => {
  await page.goto("/menus?people=8");
  await expect(page.locator(".menu-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Découvrir le menu Menu du jardin" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Menu du jardin");
  await expect(page.getByRole("heading", { name: "Conditions importantes" })).toBeVisible();
  await expect(page.getByText("10 % de remise sur le menu dès 13 personnes.")).toBeVisible();
  await expect(page.locator(".food-item")).toHaveCount(3);
  await page.getByRole("button", { name: "Afficher la photographie 2" }).click();
  await expect(page.getByRole("button", { name: "Afficher la photographie 2" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".gallery-main")).toHaveAttribute("alt", /Autre suggestion/);
  await expect(page.getByRole("button", { name: "Commander ce menu" })).toBeDisabled();
  await page.goBack();
  await expect(page).toHaveURL(/people=8/);
  await expect(page.locator(".menu-card")).toHaveCount(1);
});

test("refus des filtres malformés et aucune fuite sur une fiche absente", async ({ page, request }) => {
  const invalid = await request.get("/api/menus?priceMax=NaN");
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["cache-control"]).toBe("no-store");
  const missing = await page.goto("/menus/2147483647");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cette page est introuvable");
  await expect(page.locator(".order-summary")).toHaveCount(0);
});

test("une panne d'actualisation peut être retentée", async ({ page }) => {
  await page.goto("/menus");
  await openFilters(page);
  await page.route("**/api/menus?**", (route) => route.fulfill({ status: 503, json: { message: "Le catalogue est temporairement indisponible." } }));
  await page.getByLabel("Nombre de convives").fill("8");
  await expect(page.getByRole("alert", { name: "Le catalogue ne peut pas être affiché" })).toContainText("temporairement indisponible");
  await page.unroute("**/api/menus?**");
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.locator(".menu-card")).toHaveCount(1);
});

test("une réponse ancienne n'écrase pas le dernier choix", async ({ page }) => {
  await page.goto("/menus");
  await openFilters(page);
  let release!: () => void;
  let signal!: () => void;
  const blocked = new Promise<void>((resolve) => { signal = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/menus?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("people") === "8") {
      const response = await route.fetch();
      signal();
      await gate;
      await route.fulfill({ response }).catch(() => { /* La requête a été annulée par le nouveau choix. */ });
    } else await route.continue();
  });
  await page.getByLabel("Nombre de convives").fill("8");
  await blocked;
  await page.getByLabel("Nombre de convives").fill("12");
  await expect(page.getByRole("status")).toHaveText("3 menus à découvrir");
  release();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByRole("status")).toHaveText("3 menus à découvrir");
  await expect(page.getByLabel("Nombre de convives")).toHaveValue("12");
});

test("accessibilité automatisée, sept jours et absence de débordement", async ({ page }, info) => {
  await page.goto("/menus");
  await expect(page.locator(".menu-card")).toHaveCount(3);
  await expect(page.locator(".business-hours dt")).toHaveCount(7);
  await expect(page.locator(".business-hours dd")).toHaveText(["Fermé", ...Array(4).fill("09:00 – 13:00 / 14:00 – 18:00"), "09:00 – 13:00 / 14:00 – 17:00", "09:00 – 12:30"]);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenu")).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("catalogue.png"), fullPage: true });
  await page.getByRole("link", { name: "Découvrir le menu Menu du jardin" }).click();
  const detailScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(detailScan.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("detail.png"), fullPage: true });
});
