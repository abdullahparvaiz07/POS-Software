import prisma from "../../../config/prisma";

export class SalesReportRepository {
  async getSummary(startDate: Date, endDate: Date) {
    const orders = await prisma.order.aggregate({
      _sum: { grandTotal: true, discountAmount: true, taxAmount: true },
      _count: { id: true },
      _avg: { grandTotal: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
    });

    return {
      totalRevenue: orders._sum.grandTotal || 0,
      totalOrders: orders._count.id || 0,
      averageOrderValue: orders._avg.grandTotal || 0,
      totalDiscounts: orders._sum.discountAmount || 0,
      totalTax: orders._sum.taxAmount || 0,
    };
  }

  async getDailySales(startDate: Date, endDate: Date) {
    const rawData = await prisma.$queryRaw<[{ date: Date, total: number, orders: number }]>`
      SELECT DATE(createdAt) as date, SUM(grandTotal) as total, COUNT(id) as orders
      FROM orders
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND status = 'COMPLETED'
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;
    return rawData.map(r => ({
      date: r.date,
      total: Number(r.total) || 0,
      orders: Number(r.orders) || 0,
    }));
  }

  async getHourlySales(startDate: Date, endDate: Date) {
    // Grouping by hour requires extracting HOUR from createdAt
    const rawData = await prisma.$queryRaw<[{ hour: number, total: number, orders: number }]>`
      SELECT HOUR(createdAt) as hour, SUM(grandTotal) as total, COUNT(id) as orders
      FROM orders
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND status = 'COMPLETED'
      GROUP BY HOUR(createdAt)
      ORDER BY HOUR(createdAt) ASC
    `;
    return rawData.map(r => ({
      hour: r.hour,
      total: Number(r.total) || 0,
      orders: Number(r.orders) || 0,
    }));
  }

  async getTopSellingItems(startDate: Date, endDate: Date, limit: number = 10) {
    const result = await prisma.orderItem.groupBy({
      by: ["menuItemName"],
      _sum: { quantity: true, subtotal: true },
      where: {
        order: {
          createdAt: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: limit,
    });

    return result.map(r => ({
      item: r.menuItemName,
      quantitySold: r._sum.quantity || 0,
      revenue: r._sum?.subtotal || 0,
    }));
  }

  async getOrderTypeBreakdown(startDate: Date, endDate: Date) {
    const result = await prisma.order.groupBy({
      by: ["orderType"],
      _count: { id: true },
      _sum: { grandTotal: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
    });

    return result.map(r => ({
      orderType: r.orderType,
      orders: r._count?.id || 0,
      revenue: r._sum?.grandTotal || 0,
    }));
  }

  async getPaymentMethodBreakdown(startDate: Date, endDate: Date) {
    const result = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _count: { id: true },
      _sum: { grandTotal: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
    });

    return result.map(r => ({
      paymentMethod: r.paymentMethod,
      orders: r._count?.id || 0,
      revenue: r._sum?.grandTotal || 0,
    }));
  }
}

export default new SalesReportRepository();
