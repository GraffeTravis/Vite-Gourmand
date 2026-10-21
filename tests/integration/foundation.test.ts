import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedReferenceData } from "../../prisma/reference-data";
import { calculateMenuPrice } from "../../src/modules/orders/domain/pricing";
import { enqueueEvent } from "../../src/server/outbox/enqueue";
import { createMenu, createUser, orderData, prisma, unique } from "./database";

beforeAll(() => seedReferenceData(prisma));
afterAll(() => prisma.$disconnect());

describe("L1 — migrations, référentiels et contraintes réelles PostgreSQL", () => {
  it("réapplique le seed sans doublons ni compte privilégié", async () => {
    await seedReferenceData(prisma);
    await seedReferenceData(prisma);
    expect(await prisma.role.count()).toBe(3);
    expect(await prisma.orderState.count()).toBe(8);
    expect(await prisma.appUser.count()).toBe(0);
  });
  it("refuse les variantes de casse et les doublons d'e-mail", async () => {
    const user = await createUser();
    await expect(prisma.appUser.create({ data: { roleId: user.roleId, email: user.email.toUpperCase(), passwordHash: "test", accountState: true } })).rejects.toThrow();
    await expect(prisma.appUser.create({ data: { roleId: user.roleId, email: user.email, passwordHash: "test", accountState: true } })).rejects.toThrow();
  });
  it("refuse le stock négatif et le minimum nul", async () => {
    const menu = await createMenu();
    await expect(prisma.menu.update({ where: { id: menu.id }, data: { stock: -1 } })).rejects.toThrow();
    await expect(prisma.menu.update({ where: { id: menu.id }, data: { minimumNumberPeople: 0 } })).rejects.toThrow();
  });
  it("refuse un total falsifié et une quantité inférieure au minimum figé", async () => {
    const user = await createUser();
    const menu = await createMenu();
    const data = await orderData(user.id, menu.id);
    await expect(prisma.customerOrder.create({ data: { ...data, totalAmount: "1.00" } })).rejects.toThrow();
    await expect(prisma.customerOrder.create({ data: { ...data, numberPeople: 9 } })).rejects.toThrow();
  });
  it("applique le même arrondi SQL et métier au seuil de remise", async () => {
    const user = await createUser();
    const menu = await createMenu();
    const data = await orderData(user.id, menu.id);
    const pricing = calculateMenuPrice({ unitPrice: "19.99", minimumPeople: 10, numberPeople: 15, shippingCost: "16.80" });
    const order = await prisma.customerOrder.create({ data: { ...data, ...pricing, numberPeople: 15 } });
    expect(order.discountAmount.toFixed(2)).toBe("29.99");
    expect(order.totalAmount.toFixed(2)).toBe("286.66");
    // Un changement de prix/minimum du catalogue ne change pas les instantanés.
    await prisma.menu.update({ where: { id: menu.id }, data: { price: "50.00", minimumNumberPeople: 20 } });
    const saved = await prisma.customerOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.minimumPeopleSnapshot).toBe(10);
    expect(saved.unitPriceApplied.toFixed(2)).toBe("19.99");
  });
  it("garantit deux réservations concurrentes cohérentes sur le dernier stock", async () => {
    const menu = await createMenu(1);
    let ready = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const reserve = () => prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`;
      ready += 1;
      if (ready === 2) release();
      await gate;
      return tx.menu.updateMany({ where: { id: menu.id, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
    });
    const results = await Promise.all([reserve(), reserve()]);
    expect(results.map((result) => result.count).sort()).toEqual([0, 1]);
    expect((await prisma.menu.findUniqueOrThrow({ where: { id: menu.id } })).stock).toBe(0);
  });
  it("refuse une session expirant avant sa création et un jeton brut", async () => {
    const user = await createUser();
    await expect(prisma.authSession.create({ data: { userId: user.id, tokenHash: "a".repeat(64), createdAt: new Date("2026-01-02"), expiresAt: new Date("2026-01-01") } })).rejects.toThrow();
    await expect(prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: "jeton-brut", expiresAt: new Date("2030-01-01") } })).rejects.toThrow();
  });
  it("refuse un historique humain sans auteur", async () => {
    const user = await createUser();
    const menu = await createMenu();
    const order = await prisma.customerOrder.create({ data: await orderData(user.id, menu.id) });
    await expect(prisma.orderHistory.create({ data: { orderId: order.id, stateId: order.stateId, origin: "USER" } })).rejects.toThrow();
  });
});

describe("L1 — stockage transactionnel de l'outbox, worker à développer en L3", () => {
  it("annule stock, commande, historique et événement après une erreur", async () => {
    const user = await createUser();
    const menu = await createMenu();
    const data = await orderData(user.id, menu.id);
    const eventKey = unique();
    await expect(prisma.$transaction(async (tx) => {
      await tx.menu.update({ where: { id: menu.id }, data: { stock: { decrement: 1 } } });
      const order = await tx.customerOrder.create({ data });
      await tx.orderHistory.create({ data: { orderId: order.id, stateId: order.stateId, origin: "USER", actorId: user.id } });
      await enqueueEvent(tx, { eventKey, type: "order.created", aggregateType: "order", aggregateId: String(order.id), aggregateVersion: 1, payload: { orderId: order.id }, consumers: ["EMAIL", "ANALYTICS"] });
      throw new Error("panne injectée");
    })).rejects.toThrow("panne injectée");
    expect(await prisma.customerOrder.count({ where: { reference: data.reference } })).toBe(0);
    expect(await prisma.orderHistory.count({ where: { actorId: user.id } })).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { eventKey } })).toBe(0);
    expect((await prisma.menu.findUniqueOrThrow({ where: { id: menu.id } })).stock).toBe(1);
  });
  it("conserve l'intention et sépare la progression des consommateurs", async () => {
    const event = await prisma.$transaction(async (tx) => {
      const user = await tx.appUser.create({ data: { roleId: (await tx.role.findUniqueOrThrow({ where: { code: "USER" } })).id, email: `commit-${unique()}@example.test`, passwordHash: "test", accountState: true } });
      const result = await enqueueEvent(tx, { eventKey: unique(), type: "test.created", aggregateType: "user", aggregateId: String(user.id), aggregateVersion: 1, payload: { userId: user.id }, consumers: ["EMAIL", "ANALYTICS"] });
      return result;
    });
    expect(await prisma.appUser.findUnique({ where: { id: Number(event.aggregateId) } })).not.toBeNull();
    expect(await prisma.outboxEvent.findUnique({ where: { id: event.id } })).not.toBeNull();
    const mail = event.deliveries.find((delivery) => delivery.consumer === "EMAIL")!;
    await prisma.outboxDelivery.update({ where: { id: mail.id }, data: { state: "SUCCEEDED", processedAt: new Date() } });
    const analytics = await prisma.outboxDelivery.findUniqueOrThrow({ where: { eventId_consumer: { eventId: event.id, consumer: "ANALYTICS" } } });
    expect(analytics.state).toBe("PENDING");
    await expect(prisma.outboxDelivery.create({ data: { eventId: event.id, consumer: "EMAIL" } })).rejects.toThrow();
    await expect(prisma.outboxEvent.create({ data: { eventKey: event.eventKey, type: event.type, aggregateType: "test", aggregateId: event.aggregateId, aggregateVersion: 1, payload: {} } })).rejects.toThrow();
  });
  it("refuse un bail incomplet et autorise un bail complet", async () => {
    const event = await prisma.outboxEvent.create({ data: { eventKey: unique(), type: "test.created", aggregateType: "test", aggregateId: unique(), aggregateVersion: 1, payload: {} } });
    await expect(prisma.outboxDelivery.create({ data: { eventId: event.id, consumer: "EMAIL", state: "PROCESSING" } })).rejects.toThrow();
    const delivery = await prisma.outboxDelivery.create({ data: { eventId: event.id, consumer: "EMAIL", state: "PROCESSING", leaseToken: randomUUID(), lockedUntil: new Date(Date.now() + 60000) } });
    expect(delivery.state).toBe("PROCESSING");
  });
});
