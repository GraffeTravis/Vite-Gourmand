import "server-only";
import type { PrismaClient } from "../../../generated/prisma/client";

export async function readApprovedReviews(db: PrismaClient, includeDemo = false) {
  const rows = await db.review.findMany({
    where: { moderationState: "APPROVED", order: { state: { code: "COMPLETED" }, menu: includeDemo ? {} : { isDemo: false } } },
    select: { id: true, rating: true, comment: true, order: { select: { menu: { select: { isDemo: true } } } } },
    take: 3, orderBy: [{ moderatedAt: "desc" }, { id: "desc" }],
  });
  return rows.map((row) => ({ id: row.id, rating: row.rating, comment: row.comment, isDemo: row.order.menu.isDemo }));
}

export function readBusinessHours(db: PrismaClient) {
  return db.businessHours.findMany({ select: { weekday: true, opensAt: true, closesAt: true, isClosed: true }, orderBy: [{ weekday: "asc" }, { opensAt: "asc" }] });
}
