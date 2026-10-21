import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const url = process.env.TEST_DATABASE_URL;
if (!url || !/^\/vg_test_[a-f0-9]{32}$/.test(new URL(url).pathname)) {
  throw new Error("Les tests doivent être lancés via npm run test:integration sur une base jetable.");
}
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 5, connectionTimeoutMillis: 5000 }) });
export const unique = () => randomUUID().replaceAll("-", "");

export async function createUser() {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: "USER" } });
  return prisma.appUser.create({ data: { roleId: role.id, email: `client-${unique()}@example.test`, passwordHash: "test-only-not-a-real-hash", accountState: true } });
}

export async function createMenu(stock = 1) {
  const theme = await prisma.theme.create({ data: { label: `Thème test ${unique()}` } });
  const diet = await prisma.diet.create({ data: { label: `Régime test ${unique()}` } });
  return prisma.menu.create({ data: { themeId: theme.id, dietId: diet.id, title: "MENU FICTIF — TEST AUTOMATISÉ", description: "Fixture jetable uniquement", price: "19.99", minimumNumberPeople: 10, commandConditions: "Données de test", stock, isActive: false } });
}

export async function orderData(clientId: number, menuId: number) {
  const state = await prisma.orderState.findUniqueOrThrow({ where: { code: "RECEIVED" } });
  return {
    clientId, menuId, stateId: state.id, reference: `TEST-${unique()}`,
    numberPeople: 10, minimumPeopleSnapshot: 10,
    serviceDate: new Date("2027-01-20T00:00:00Z"), serviceTime: new Date("1970-01-01T12:00:00Z"),
    location: "Lieu fictif", shippingAddress: "Adresse de test", shippingPostalCode: "33000", shippingCity: "Bordeaux",
    contactLastName: "Test", contactFirstName: "Client", contactGsm: "+33600000000", contactEmail: "client@example.test",
    menuTitleSnapshot: "MENU FICTIF — TEST AUTOMATISÉ", unitPriceApplied: "19.99", menuSubtotal: "199.90",
    discountRate: "0", discountAmount: "0.00", shippingCost: "0.00", totalAmount: "199.90",
  };
}
