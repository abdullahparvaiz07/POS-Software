import prisma from "../../config/prisma";

export class DashboardRepository {
  async getTodayStats(startOfDay: Date, endOfDay: Date) {
    try {
      const [sales, orders, activeOrders, kitchenPending, barPending, cancelledStats, creditStats, cashSales, totalCreditBook] = await Promise.all([
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" },
          },
        }),
        prisma.order.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.order.count({
          where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
        }),
        prisma.kitchenQueue.count({
          where: { status: { in: ["PENDING", "PREPARING"] } },
        }),
        prisma.barQueue.count({
          where: { status: { in: ["PENDING", "PREPARING"] } },
        }),
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          _count: { id: true },
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: "CANCELLED",
          },
        }),
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          _count: { id: true },
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: "COMPLETED",
            paymentStatus: "UNPAID",
          },
        }),
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" },
            paymentStatus: "PAID",
            paymentMethod: "CASH",
          },
        }),
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          where: {
            status: "COMPLETED",
            paymentStatus: "UNPAID",
          },
        })
      ]);

      return {
        todaySales: Number(sales._sum.grandTotal || 0),
        todayOrders: orders || 0,
        activeOrders: activeOrders || 0,
        kitchenPending: kitchenPending || 0,
        barPending: barPending || 0,
        cancelledOrders: cancelledStats._count.id || 0,
        cancelledRevenue: Number(cancelledStats._sum.grandTotal || 0),
        creditOrders: creditStats._count.id || 0,
        creditedAmount: Number(totalCreditBook._sum.grandTotal || 0),
        cashSales: Number(cashSales._sum.grandTotal || 0)
      };
    } catch {
      return {
        todaySales: 0,
        todayOrders: 0,
        activeOrders: 0,
        kitchenPending: 0,
        barPending: 0,
        cancelledOrders: 0,
        cancelledRevenue: 0,
        creditOrders: 0,
        creditedAmount: 0,
        cashSales: 0
      };
    }
  }

  async getMonthlyRevenue(startOfMonth: Date, endOfMonth: Date) {
    try {
      const result = await prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "CANCELLED" },
        },
      });
      return Number(result._sum.grandTotal || 0);
    } catch {
      return 0;
    }
  }

  async getLowStockCount() {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM ingredients WHERE currentStock <= minimumStock AND isActive = true AND deletedAt IS NULL
      `;
      if (result && result.length > 0 && result[0].count !== undefined) {
        return Number(result[0].count);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async getTopSellingItems(limit: number = 4) {
    try {
      const result = await prisma.orderItem.groupBy({
        by: ["menuItemName"],
        _sum: { quantity: true, subtotal: true },
        where: {
          order: { status: { not: "CANCELLED" } },
        },
        orderBy: {
          _sum: { quantity: "desc" },
        },
        take: limit,
      });
      return result.map(r => ({
        item: r.menuItemName,
        quantity: r._sum.quantity || 0,
        revenue: Number(r._sum.subtotal) || 0,
      }));
    } catch {
      return [];
    }
  }

  async getTopIngredients(limit: number = 5) {
    try {
      const result = await prisma.stockMovement.groupBy({
        by: ["ingredientId"],
        _sum: { quantity: true },
        where: {
          movementType: "SALE",
        },
        orderBy: {
          _sum: { quantity: "asc" },
        },
        take: limit,
      });
      
      const ingredientIds = result.map(r => r.ingredientId);
      const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true, name: true },
      });

      const ingredientMap = new Map(ingredients.map(i => [i.id, i.name]));

      return result.map(r => ({
        item: ingredientMap.get(r.ingredientId) || "Unknown",
        quantity: Math.abs(Number(r._sum.quantity || 0)),
      }));
    } catch {
      return [];
    }
  }

  async getRecentOrders(limit: number = 50) {
    try {
      return await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          orderType: true,
          takeawayMode: true,
          tableNumber: true,
          paymentStatus: true,
          assignedStaff: {
            select: {
              fullName: true,
            }
          },
        },
      });
    } catch {
      return [];
    }
  }

  async getRecentPurchases(limit: number = 5) {
    try {
      return await prisma.purchase.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          purchaseNumber: true,
          purchaseStatus: true,
          grandTotal: true,
          supplier: {
            select: { name: true }
          }
        },
      });
    } catch {
      return [];
    }
  }

  async getSalesTrend(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      const rawData = await prisma.$queryRaw<any[]>`
        SELECT DATE(createdAt) as date, SUM(grandTotal) as total, COUNT(*) as ordersCount
        FROM orders
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND status != 'CANCELLED'
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt) ASC
      `;

      if (!Array.isArray(rawData)) return [];

      return rawData.map(r => ({
        date: r.date ? (r.date instanceof Date ? r.date.toISOString() : String(r.date)) : new Date().toISOString(),
        total: Number(r.total || 0),
        ordersCount: Number(r.ordersCount || 0),
      }));
    } catch {
      return [];
    }
  }

  async getOrderTypeBreakdown(startOfDay: Date, endOfDay: Date) {
    try {
      const result = await prisma.order.groupBy({
        by: ["orderType"],
        _count: { _all: true },
        _sum: { grandTotal: true },
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELLED" }
        }
      });

      const total = result.reduce((acc, curr) => acc + curr._count._all, 0);

      return result.map(r => ({
        type: r.orderType,
        count: r._count._all,
        percentage: total > 0 ? (r._count._all / total) * 100 : 0,
        revenue: Number(r._sum.grandTotal) || 0,
      }));
    } catch {
      return [];
    }
  }
}

export default new DashboardRepository();