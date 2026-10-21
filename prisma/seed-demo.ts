import { seedDemoCatalog } from "./demo-catalogue";
import { localSeedClient } from "./local-seed-client";

const db = localSeedClient();
try {
  const ids = await seedDemoCatalog(db);
  console.info(`${ids.length} menus de démonstration disponibles. Aucun compte, avis ni horaire créé.`);
} finally { await db.$disconnect(); }
