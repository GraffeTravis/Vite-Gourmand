import { seedBusinessHours } from "./business-hours";
import { localSeedClient } from "./local-seed-client";

const db = localSeedClient();
try {
  const created = await seedBusinessHours(db);
  console.info(created ? "Horaires d’accueil initialisés selon les valeurs fournies pour le projet." : "Horaires déjà renseignés : aucune valeur remplacée.");
} finally { await db.$disconnect(); }
