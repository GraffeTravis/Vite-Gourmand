import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedReferenceData(prisma: PrismaClient) {
  await prisma.$transaction([
    ...[["USER", "Utilisateur"], ["EMPLOYEE", "Employé"], ["ADMIN", "Administrateur"]].map(([code, label]) =>
      prisma.role.upsert({ where: { code }, create: { code, label }, update: { label } })),
    ...[["RECEIVED", "Reçue"], ["ACCEPTED", "Acceptée"], ["PREPARING", "En préparation"],
      ["OUT_FOR_DELIVERY", "En cours de livraison"], ["DELIVERED", "Livrée"],
      ["AWAITING_EQUIPMENT_RETURN", "En attente du retour de matériel"],
      ["COMPLETED", "Terminée"], ["CANCELLED", "Annulée"]].map(([code, label]) =>
      prisma.orderState.upsert({ where: { code }, create: { code, label }, update: { label } })),
  ]);
}
