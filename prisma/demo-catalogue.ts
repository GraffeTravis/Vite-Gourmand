import type { PrismaClient } from "../src/generated/prisma/client";

const examples = [
  { title: "Menu convivial", price: "24.00", minimum: 10, theme: "Convivial", diet: "Traditionnel", photo: "convivial", description: "Une formule généreuse à partager, pour les repas qui rassemblent.", foods: ["Velouté de saison", "Poulet rôti et légumes", "Tarte aux pommes"] },
  { title: "Menu du jardin", price: "22.00", minimum: 8, theme: "Saison", diet: "Végétarien", photo: "jardin", description: "Une table colorée qui fait la part belle aux légumes et aux saveurs de saison.", foods: ["Salade de lentilles", "Tarte aux légumes", "Cake au citron"] },
  { title: "Menu des grandes occasions", price: "32.00", minimum: 12, theme: "Événement", diet: "Pescétarien", photo: "occasions", description: "Une proposition festive pour accompagner vos grandes tablées.", foods: ["Entrée aux asperges", "Saumon et légumes", "Fondant au chocolat"] },
];

// Jeu fictif séparé du seed de référentiels, jamais exécuté au démarrage du site.
export async function seedDemoCatalog(db: PrismaClient) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(70720261020)`;
    const ids: number[] = [];
    const allergens: { id: number }[] = [];
    for (const label of ["Gluten", "Lait", "Œufs"]) allergens.push(await tx.allergen.upsert({ where: { label }, update: {}, create: { label } }));
    for (const sample of examples) {
      const theme = await tx.theme.upsert({ where: { label: sample.theme }, update: {}, create: { label: sample.theme } });
      const diet = await tx.diet.upsert({ where: { label: sample.diet }, update: {}, create: { label: sample.diet } });
      const existing = await tx.menu.findFirst({ where: { isDemo: true, title: sample.title }, select: { id: true } });
      if (existing) { ids.push(existing.id); continue; }
      const menu = await tx.menu.create({ data: {
        themeId: theme.id, dietId: diet.id, title: sample.title, description: sample.description,
        price: sample.price, minimumNumberPeople: sample.minimum, stock: 5, isDemo: true, isActive: false,
        commandConditions: "Exemple fictif de présentation. Composition, allergènes et conditions de démonstration : aucune prestation réelle ne peut être commandée.",
        menuImageByMenuId: { create: [
          { uri: `/images/demo/${sample.photo}.jpg`, altText: "Photographie culinaire illustrative pour la démonstration", displayOrder: 0 },
          { uri: `/images/demo/${sample.photo === "jardin" ? "convivial" : "jardin"}.jpg`, altText: "Autre suggestion de présentation culinaire, photographie illustrative", displayOrder: 1 },
        ] },
      } });
      for (const [index, name] of sample.foods.entries()) {
        const food = await tx.food.create({ data: { name, category: ["STARTER", "MAIN", "DESSERT"][index], description: "Composition fictive réservée aux tests et à la démonstration." } });
        if (index === 2) await tx.foodAllergen.createMany({ data: allergens.map((allergen) => ({ foodId: food.id, allergenId: allergen.id })) });
        await tx.food.update({ where: { id: food.id }, data: { allergensVerified: true } });
        await tx.menuFood.create({ data: { menuId: menu.id, foodId: food.id, displayOrder: index } });
      }
      await tx.menu.update({ where: { id: menu.id }, data: { isActive: true } });
      ids.push(menu.id);
    }
    return ids;
  });
}
