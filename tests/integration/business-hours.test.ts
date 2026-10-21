import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedBusinessHours } from "../../prisma/business-hours";
import { publicHours } from "../../src/modules/public/domain/hours";
import { readBusinessHours } from "../../src/modules/public/server/content";
import { prisma } from "./database";

beforeAll(() => seedBusinessHours(prisma));
afterAll(() => prisma.$disconnect());
const time = (value: string) => new Date(`1970-01-01T${value}:00Z`);

describe("D04 — horaires d'accueil fournis pour le projet", () => {
  it("préserve les valeurs et identifiants lors d'une réinitialisation", async () => {
    const before = await prisma.businessHours.findMany({ orderBy: { id: "asc" } });
    expect(before).toHaveLength(12);
    expect(await seedBusinessHours(prisma)).toBe(false);
    expect(await prisma.businessHours.findMany({ orderBy: { id: "asc" } })).toEqual(before);
  });
  it("affiche les sept jours et les deux plages aux heures de Bordeaux", async () => {
    expect(publicHours(await readBusinessHours(prisma)).map((day) => day.text)).toEqual(["Fermé", ...Array(4).fill("09:00 – 13:00 / 14:00 – 18:00"), "09:00 – 13:00 / 14:00 – 17:00", "09:00 – 12:30"]);
  });
  it("refuse un créneau inversé, une fermeture contradictoire et un chevauchement", async () => {
    await expect(prisma.businessHours.create({ data: { weekday: 2, isClosed: false, opensAt: time("18:00"), closesAt: time("14:00") } })).rejects.toThrow();
    await expect(prisma.businessHours.create({ data: { weekday: 2, isClosed: true } })).rejects.toThrow();
    await expect(prisma.businessHours.create({ data: { weekday: 2, isClosed: false, opensAt: time("10:00"), closesAt: time("11:00") } })).rejects.toThrow();
  });
});
