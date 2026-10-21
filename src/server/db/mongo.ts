import "server-only";
import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
import { getServerEnvironment } from "../config";

const globalMongo = globalThis as unknown as { mongo?: Promise<MongoClient> };
export async function getAnalyticsDatabase() {
  const { MONGODB_URI: uri, MONGODB_DATABASE: database } = getServerEnvironment();
  if (!globalMongo.mongo) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 5, maxIdleTimeMS: 5000 });
    if (process.env.VERCEL) attachDatabasePool(client);
    globalMongo.mongo = client.connect().catch((error: unknown) => {
      globalMongo.mongo = undefined;
      throw error;
    });
  }
  return (await globalMongo.mongo).db(database);
}

// Utilisé par les vérifications et traitements en ligne de commande, pas par chaque requête HTTP.
export async function closeAnalyticsConnection() {
  const connection = globalMongo.mongo;
  globalMongo.mongo = undefined;
  if (connection) await (await connection).close();
}
