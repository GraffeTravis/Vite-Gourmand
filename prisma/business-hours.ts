import type { Prisma, PrismaClient } from "../src/generated/prisma/client";

// Horaires d'accueil sur place/téléphone fournis par le porteur du projet le 20 octobre 2026.
// Heures locales de Bordeaux (Europe/Paris) ; ce ne sont pas des créneaux de livraison.
export const projectHours = [
  { weekday: 1, slots: [] },
  { weekday: 2, slots: [["09:00", "13:00"], ["14:00", "18:00"]] },
  { weekday: 3, slots: [["09:00", "13:00"], ["14:00", "18:00"]] },
  { weekday: 4, slots: [["09:00", "13:00"], ["14:00", "18:00"]] },
  { weekday: 5, slots: [["09:00", "13:00"], ["14:00", "18:00"]] },
  { weekday: 6, slots: [["09:00", "13:00"], ["14:00", "17:00"]] },
  { weekday: 7, slots: [["09:00", "12:30"]] },
];

export async function seedBusinessHours(db: PrismaClient) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(70720261021)`;
    if (await tx.businessHours.count()) return false;
    await tx.businessHours.createMany({ data: projectHours.flatMap<Prisma.BusinessHoursCreateManyInput>(({ weekday, slots }) => slots.length ? slots.map(([open, close]) => ({
      weekday, isClosed: false, opensAt: new Date(`1970-01-01T${open}:00Z`), closesAt: new Date(`1970-01-01T${close}:00Z`),
    })) : [{ weekday, isClosed: true, opensAt: null, closesAt: null }]) });
    return true;
  });
}
