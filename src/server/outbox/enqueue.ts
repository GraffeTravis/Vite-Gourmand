import "server-only";
import type { Prisma } from "../../generated/prisma/client";

type Consumer = "EMAIL" | "ANALYTICS";

export function enqueueEvent(transaction: Prisma.TransactionClient, input: {
  eventKey: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  payload: Prisma.InputJsonObject;
  consumers: readonly [Consumer, ...Consumer[]];
}) {
  const { consumers, ...event } = input;
  // Le service appelant fournit sa transaction métier ; aucun appel réseau ici.
  // Une clé déjà utilisée échoue sans réécrire l'événement d'origine.
  return transaction.outboxEvent.create({
    data: { ...event, deliveries: { create: consumers.map((consumer) => ({ consumer })) } },
    include: { deliveries: true },
  });
}
