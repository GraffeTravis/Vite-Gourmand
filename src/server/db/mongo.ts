import "server-only";
import { MongoClient } from "mongodb";
import { getServerEnvironment } from "../config";

const globalMongo = globalThis as unknown as { mongo?: Promise<MongoClient> };
export async function getAnalyticsDatabase() {
  const { MONGODB_URI: uri, MONGODB_DATABASE: database } = getServerEnvironment();
  globalMongo.mongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect().catch((error: unknown) => {
    globalMongo.mongo = undefined;
    throw error;
  });
  return (await globalMongo.mongo).db(database);
}
