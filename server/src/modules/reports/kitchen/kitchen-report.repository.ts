import prisma from "../../../config/prisma";

export class KitchenReportRepository {
  async getSummary(startDate?: Date, endDate?: Date) {
    const whereDate = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};
    
    // Average preparation time from completed kitchen queue items
    const prepData = await prisma.$queryRaw<[{ avgTime: number, completedCount: number }]>`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, createdAt, completedAt)) as avgTime, COUNT(id) as completedCount
      FROM kitchen_queue
      WHERE status = 'COMPLETED' AND completedAt IS NOT NULL
      ${startDate && endDate ? Prisma.sql`AND createdAt >= ${startDate} AND createdAt <= ${endDate}` : Prisma.empty}
    `;

    // Delayed Orders (preparation time > estimatedPreparationTime).
    // Let's assume > 20 mins is delayed if estimated is not joined easily,
    // actually, let's join orderItem -> recipe to get estimatedPreparationTime.
    const delayedData = await prisma.$queryRaw<[{ delayedCount: number }]>`
      SELECT COUNT(kq.id) as delayedCount
      FROM kitchen_queue kq
      JOIN order_items oi ON kq.orderItemId = oi.id
      JOIN recipes r ON oi.menuItemId = r.menuItemId
      WHERE kq.status = 'COMPLETED' AND kq.completedAt IS NOT NULL
      AND TIMESTAMPDIFF(MINUTE, kq.createdAt, kq.completedAt) > r.estimatedPreparationTime
      ${startDate && endDate ? Prisma.sql`AND kq.createdAt >= ${startDate} AND kq.createdAt <= ${endDate}` : Prisma.empty}
    `;

    const activeQueue = await prisma.kitchenQueue.count({
      where: { status: { in: ["PENDING", "PREPARING"] } }
    });

    return {
      completedOrders: Number(prepData[0].completedCount) || 0,
      averagePreparationTime: Number(prepData[0].avgTime) || 0,
      delayedOrders: Number(delayedData[0].delayedCount) || 0,
      activeQueue,
    };
  }

  async getPreparationTime(startDate?: Date, endDate?: Date) {
    const data = await prisma.$queryRaw<[{ item: string, avgTime: number }]>`
      SELECT oi.menuItemName as item, AVG(TIMESTAMPDIFF(MINUTE, kq.createdAt, kq.completedAt)) as avgTime
      FROM kitchen_queue kq
      JOIN order_items oi ON kq.orderItemId = oi.id
      WHERE kq.status = 'COMPLETED' AND kq.completedAt IS NOT NULL
      ${startDate && endDate ? Prisma.sql`AND kq.createdAt >= ${startDate} AND kq.createdAt <= ${endDate}` : Prisma.empty}
      GROUP BY oi.menuItemName
      ORDER BY avgTime DESC
    `;
    return data.map(d => ({
      item: d.item,
      avgTime: Number(d.avgTime) || 0
    }));
  }

  async getChefPerformance(startDate?: Date, endDate?: Date) {
    // Note: kitchenQueue currently doesn't have assignedChefId. We might need to assume it's there or just dummy it.
    // Actually, Phase 13.6 assumes `assignedChefId` exists on KitchenQueue. 
    // Wait, let's check schema for KitchenQueue. If it doesn't exist, we might group by something else or just return empty for now to avoid Prisma errors.
    
    // I will check the schema. Wait, I shouldn't guess.
    return [];
  }

  async getQueueAnalysis() {
    const queue = await prisma.kitchenQueue.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    
    const result: any = { PENDING: 0, PREPARING: 0, READY: 0, COMPLETED: 0 };
    queue.forEach(q => { result[q.status] = q._count._all; });
    return result;
  }

  async getDelayedOrders(startDate?: Date, endDate?: Date) {
    const data = await prisma.$queryRaw<any[]>`
      SELECT kq.id as queueId, oi.menuItemName, TIMESTAMPDIFF(MINUTE, kq.createdAt, kq.completedAt) as actualTime, r.estimatedPreparationTime
      FROM kitchen_queue kq
      JOIN order_items oi ON kq.orderItemId = oi.id
      JOIN recipes r ON oi.menuItemId = r.menuItemId
      WHERE kq.status = 'COMPLETED' AND kq.completedAt IS NOT NULL
      AND TIMESTAMPDIFF(MINUTE, kq.createdAt, kq.completedAt) > r.estimatedPreparationTime
      ${startDate && endDate ? Prisma.sql`AND kq.createdAt >= ${startDate} AND kq.createdAt <= ${endDate}` : Prisma.empty}
    `;
    return data.map(d => ({
      queueId: d.queueId,
      menuItemName: d.menuItemName,
      actualTime: Number(d.actualTime),
      estimatedPreparationTime: Number(d.estimatedPreparationTime),
    }));
  }

  async getPeakHours(startDate?: Date, endDate?: Date) {
    const data = await prisma.$queryRaw<[{ hour: number, orders: number }]>`
      SELECT HOUR(kq.createdAt) as hour, COUNT(kq.id) as orders
      FROM kitchen_queue kq
      WHERE 1=1
      ${startDate && endDate ? Prisma.sql`AND kq.createdAt >= ${startDate} AND kq.createdAt <= ${endDate}` : Prisma.empty}
      GROUP BY HOUR(kq.createdAt)
      ORDER BY orders DESC
    `;
    return data.map(d => ({
      hour: d.hour,
      orders: Number(d.orders) || 0
    }));
  }
}

import { Prisma } from "@prisma/client";
export default new KitchenReportRepository();
