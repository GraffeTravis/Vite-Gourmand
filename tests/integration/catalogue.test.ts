import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedReferenceData } from "../../prisma/reference-data";
import { seedDemoCatalog } from "../../prisma/demo-catalogue";
import { readCatalog, readMenuDetail } from "../../src/modules/menus/server/catalogue";
import { readApprovedReviews } from "../../src/modules/public/server/content";
import { createMenu, createUser, orderData, prisma, unique } from "./database";

let demoIds: number[];
beforeAll(async () => { await seedReferenceData(prisma); demoIds = await seedDemoCatalog(prisma); });
afterAll(() => prisma.$disconnect());

async function publishableMenu() {
  const menu = await createMenu();
  const food = await prisma.food.create({ data: { name: `Plat test ${unique()}`, category: "MAIN", allergensVerified: true } });
  await prisma.menuFood.create({ data: { menuId: menu.id, foodId: food.id, displayOrder: 0 } });
  await prisma.menuImage.create({ data: { menuId: menu.id, uri: "/images/demo/jardin.jpg", altText: "Photographie de démonstration", displayOrder: 0 } });
  return { menu, food };
}

describe("L1/L2 — catalogue public réel et D06", () => {
  it("rejoue le jeu fictif sans doublon ni création de compte", async () => {
    const usersBefore = await prisma.appUser.count();
    expect(await seedDemoCatalog(prisma)).toEqual(demoIds);
    expect(await prisma.menu.count({ where: { isDemo: true } })).toBe(3);
    expect(await prisma.appUser.count()).toBe(usersBefore);
  });
  it("exclut les données de démonstration par défaut, y compris en accès direct", async () => {
    const catalog = await readCatalog(prisma, { page: 1 });
    expect(catalog.total).toBe(0);
    expect(await readMenuDetail(prisma, demoIds[0])).toBeNull();
  });
  it("retourne uniquement les champs publics et des prix décimaux sérialisables", async () => {
    const catalog = await readCatalog(prisma, { page: 1 }, true);
    expect(catalog.total).toBe(3);
    expect(catalog.menus.every((menu) => typeof menu.price === "string" && menu.isDemo)).toBe(true);
    expect(JSON.stringify(catalog)).not.toMatch(/passwordHash|contactEmail|clientId|roleId/);
  });
  it.each([[7, 0], [8, 1], [10, 2], [12, 3], [20, 3]])("propose %i personnes : %i menus compatibles", async (people, count) => {
    expect((await readCatalog(prisma, { page: 1, people }, true)).total).toBe(count);
  });
  it("combine fourchette, plafond, thème, régime et groupe en ET", async () => {
    const initial = await readCatalog(prisma, { page: 1 }, true);
    const theme = initial.themes.find((item) => item.label === "Saison")!;
    const diet = initial.diets.find((item) => item.label === "Végétarien")!;
    const result = await readCatalog(prisma, { page: 1, people: 8, theme: theme.id, diet: diet.id, priceMin: "22.00", priceMax: "30", priceCap: "24" }, true);
    expect(result.menus.map((menu) => menu.title)).toEqual(["Menu du jardin"]);
    expect((await readCatalog(prisma, { page: 1, priceCap: "0" }, true)).total).toBe(0);
  });
  it("présente une fiche complète avec galerie et allergènes de chaque plat", async () => {
    const detail = await readMenuDetail(prisma, demoIds[1], true);
    expect(detail?.title).toBe("Menu du jardin");
    expect(detail?.images).toHaveLength(2);
    expect(detail?.foods).toHaveLength(3);
    expect(detail?.foods[2].allergens).toEqual(["Gluten", "Lait", "Œufs"]);
  });
  it("pagine sans doublons avec un ordre stable", async () => {
    const theme = await prisma.theme.create({ data: { label: `Pagination ${unique()}` } });
    const diet = await prisma.diet.findFirstOrThrow();
    const food = await prisma.food.create({ data: { name: "Plat fictif pagination", category: "MAIN", allergensVerified: true } });
    const ids: number[] = [];
    try {
      for (let index = 0; index < 13; index += 1) {
        const menu = await prisma.menu.create({ data: {
          title: `Menu pagination ${String(index).padStart(2, "0")}`, description: "Fixture pagination", themeId: theme.id, dietId: diet.id,
          price: "25.00", minimumNumberPeople: 20, stock: 1, isActive: true, commandConditions: "Fixture de test",
          menuFoodByMenuId: { create: { foodId: food.id, displayOrder: 0 } },
          menuImageByMenuId: { create: { uri: "/images/demo/jardin.jpg", altText: "Illustration de test", displayOrder: 0 } },
        } });
        ids.push(menu.id);
      }
      const first = await readCatalog(prisma, { page: 1, theme: theme.id, people: 20 });
      const second = await readCatalog(prisma, { page: 2, theme: theme.id, people: 20 });
      expect(first.total).toBe(13);
      expect(first.menus).toHaveLength(12);
      expect(second.menus).toHaveLength(1);
      expect(new Set([...first.menus, ...second.menus].map((menu) => menu.id)).size).toBe(13);
      expect((await readCatalog(prisma, { page: 1, theme: theme.id, people: 19 })).total).toBe(0);
    } finally { await prisma.menu.updateMany({ where: { id: { in: ids } }, data: { isActive: false } }); }
  });
  it("masque un brouillon et refuse de publier un menu sans image ni plat", async () => {
    const menu = await createMenu();
    expect(await readMenuDetail(prisma, menu.id, true)).toBeNull();
    await expect(prisma.menu.update({ where: { id: menu.id }, data: { isActive: true } })).rejects.toThrow();
    expect((await prisma.menu.findUniqueOrThrow({ where: { id: menu.id } })).isActive).toBe(false);
  });
  it("empêche une perte d'image ou une composition non vérifiée sur un menu publié", async () => {
    const { menu, food } = await publishableMenu();
    await prisma.menu.update({ where: { id: menu.id }, data: { isActive: true } });
    try {
      await expect(prisma.menuImage.deleteMany({ where: { menuId: menu.id } })).rejects.toThrow();
      await expect(prisma.food.update({ where: { id: food.id }, data: { description: "Composition modifiée" } })).rejects.toThrow();
      expect((await prisma.food.findUniqueOrThrow({ where: { id: food.id } })).allergensVerified).toBe(true);
      const allergen = await prisma.allergen.create({ data: { label: `Allergène test ${unique()}` } });
      await expect(prisma.foodAllergen.create({ data: { foodId: food.id, allergenId: allergen.id } })).rejects.toThrow();
    } finally { await prisma.menu.update({ where: { id: menu.id }, data: { isActive: false } }); }
  });
  it("permet une mise à jour atomique avec nouvelle vérification explicite des allergènes", async () => {
    const { menu, food } = await publishableMenu();
    await prisma.menu.update({ where: { id: menu.id }, data: { isActive: true } });
    try {
      await prisma.$transaction(async (tx) => {
        await tx.food.update({ where: { id: food.id }, data: { description: "Nouvelle composition fictive contrôlée" } });
        await tx.food.update({ where: { id: food.id }, data: { allergensVerified: true } });
      });
      expect((await readMenuDetail(prisma, menu.id))?.foods[0].description).toContain("contrôlée");
    } finally { await prisma.menu.update({ where: { id: menu.id }, data: { isActive: false } }); }
  });
  it("préserve une image lors de deux suppressions concurrentes sur le même menu publié", async () => {
    const { menu } = await publishableMenu();
    await prisma.menuImage.create({ data: { menuId: menu.id, uri: "/images/demo/convivial.jpg", altText: "Deuxième illustration de test", displayOrder: 1 } });
    await prisma.menu.update({ where: { id: menu.id }, data: { isActive: true } });
    try {
      const images = await prisma.menuImage.findMany({ where: { menuId: menu.id } });
      const results = await Promise.allSettled(images.map((image) => prisma.$transaction((tx) => tx.menuImage.delete({ where: { id: image.id } }))));
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(await prisma.menuImage.count({ where: { menuId: menu.id } })).toBe(1);
    } finally { await prisma.menu.update({ where: { id: menu.id }, data: { isActive: false } }); }
  });
  it("garde visible un menu épuisé et archive un menu référencé sans effacer la commande", async () => {
    const { menu } = await publishableMenu();
    const user = await createUser();
    const order = await prisma.customerOrder.create({ data: await orderData(user.id, menu.id) });
    await prisma.menu.update({ where: { id: menu.id }, data: { isActive: true, stock: 0 } });
    expect((await readMenuDetail(prisma, menu.id))?.stock).toBe(0);
    await expect(prisma.menu.delete({ where: { id: menu.id } })).rejects.toThrow();
    await prisma.menu.update({ where: { id: menu.id }, data: { isActive: false } });
    expect(await readMenuDetail(prisma, menu.id)).toBeNull();
    expect(await prisma.customerOrder.findUnique({ where: { id: order.id } })).not.toBeNull();
  });
  it("affiche uniquement les avis approuvés, sans coordonnées client", async () => {
    const user = await createUser();
    const completed = await prisma.orderState.findUniqueOrThrow({ where: { code: "COMPLETED" } });
    const moderatorRole = await prisma.role.findUniqueOrThrow({ where: { code: "EMPLOYEE" } });
    const moderator = await prisma.appUser.create({ data: { email: `moderator-${unique()}@example.test`, passwordHash: "test", roleId: moderatorRole.id, accountState: true } });
    const orders = await Promise.all([1, 2, 3].map(async () => prisma.customerOrder.create({ data: { ...await orderData(user.id, demoIds[0]), stateId: completed.id } })));
    await prisma.review.create({ data: { orderId: orders[0].id, rating: 5, comment: "AVIS APPROUVÉ TEST", moderationState: "APPROVED", moderatorId: moderator.id, moderatedAt: new Date() } });
    await prisma.review.create({ data: { orderId: orders[1].id, rating: 4, comment: "AVIS EN ATTENTE TEST", moderationState: "PENDING" } });
    await prisma.review.create({ data: { orderId: orders[2].id, rating: 1, comment: "AVIS REFUSÉ TEST", moderationState: "REJECTED", moderatorId: moderator.id, moderatedAt: new Date() } });
    const publicReviews = await readApprovedReviews(prisma, true);
    expect(publicReviews.map((review) => review.comment)).toEqual(["AVIS APPROUVÉ TEST"]);
    expect(JSON.stringify(publicReviews)).not.toContain(user.email);
    expect(await readApprovedReviews(prisma)).toEqual([]);
  });
});
