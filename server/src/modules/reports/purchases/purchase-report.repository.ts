import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";

export class PurchaseReportRepository {
  async getSummary(startDate?: Date, endDate?: Date) {
    const where: Prisma.PurchaseWhereInput = { deletedAt: null };
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const purchases = await prisma.purchase.aggregate({
      _sum: { grandTotal: true },
      _count: { _all: true },
      _avg: { grandTotal: true },
      where,
    });

    const activeSuppliersResult = await prisma.purchase.groupBy({
      by: ["supplierId"],
      where,
    });
    
    // Calculate outstanding balance: Purchases that are not PAID.
    const unpaidPurchases = await prisma.purchase.aggregate({
      _sum: { grandTotal: true },
      where: {
        ...where,
        paymentStatus: { not: "PAID" }
      }
    });
    // In a real system, you might have an amountPaid field. If not, this is a simplified outstanding balance.
    
    return {
      totalPurchases: purchases._count._all || 0,
      totalPurchaseAmount: purchases._sum.grandTotal || 0,
      averagePurchaseValue: purchases._avg.grandTotal || 0,
      outstandingBalance: unpaidPurchases._sum.grandTotal || 0,
      activeSuppliers: activeSuppliersResult.length,
    };
  }

  async getDailyPurchases(startDate: Date, endDate: Date) {
    const rawData = await prisma.$queryRaw<[{ date: Date, total: number, count: number }]>`
      SELECT DATE(createdAt) as date, SUM(grandTotal) as total, COUNT(id) as count
      FROM purchases
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND deletedAt IS NULL
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;
    return rawData.map(r => ({
      date: r.date,
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
    }));
  }

  async getMonthlyPurchases(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const rawData = await prisma.$queryRaw<[{ month: number, total: number, count: number }]>`
      SELECT MONTH(createdAt) as month, SUM(grandTotal) as total, COUNT(id) as count
      FROM purchases
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND deletedAt IS NULL
      GROUP BY MONTH(createdAt)
      ORDER BY MONTH(createdAt) ASC
    `;
    return rawData.map(r => ({
      month: r.month,
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
    }));
  }

  async getSupplierReport(supplierId?: number) {
    const where: Prisma.PurchaseWhereInput = { deletedAt: null };
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const result = await prisma.purchase.groupBy({
      by: ["supplierId"],
      _count: { _all: true },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
      _max: { createdAt: true },
      where,
    });

    const supplierIds = result.map(r => r.supplierId);
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });

    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    return result.map(r => ({
      supplierId: r.supplierId,
      supplierName: supplierMap.get(r.supplierId) || "Unknown",
      numberOfPurchases: r._count._all,
      totalAmount: r._sum.grandTotal || 0,
      averageOrderValue: r._avg.grandTotal || 0,
      lastPurchaseDate: r._max.createdAt,
    }));
  }

  async getPurchaseItems(startDate?: Date, endDate?: Date) {
    const where: Prisma.PurchaseItemWhereInput = {};
    if (startDate && endDate) {
      where.purchase = { createdAt: { gte: startDate, lte: endDate } };
    }

    const result = await prisma.purchaseItem.groupBy({
      by: ["ingredientId"],
      _sum: { quantity: true, total: true },
      where,
    });

    const ingredientIds = result.map(r => r.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true, name: true, lastPurchasePrice: true },
    });

    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    // Note: Supplier isn't easily grouped here without raw query joining tables,
    // For simplicity, we just return the aggregated items.

    return result.map(r => ({
      ingredientId: r.ingredientId,
      ingredientName: ingredientMap.get(r.ingredientId)?.name || "Unknown",
      purchasedQuantity: r._sum.quantity || 0,
      purchaseCost: r._sum.total || 0,
      lastPurchasePrice: ingredientMap.get(r.ingredientId)?.lastPurchasePrice || 0,
    }));
  }

  async getOutstandingPayments() {
    return prisma.purchase.findMany({
      where: { paymentStatus: { not: "PAID" }, deletedAt: null },
      select: {
        purchaseNumber: true,
        grandTotal: true, // Assuming full amount is outstanding for simplicity
        supplier: { select: { name: true } },
        createdAt: true, // as due date placeholder
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async getTopSuppliers(limit: number = 5) {
    const result = await prisma.purchase.groupBy({
      by: ["supplierId"],
      _count: { _all: true },
      _sum: { grandTotal: true },
      where: { deletedAt: null },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: limit,
    });

    const supplierIds = result.map(r => r.supplierId);
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });

    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    return result.map(r => ({
      supplierName: supplierMap.get(r.supplierId) || "Unknown",
      totalPurchases: r._count._all,
      totalSpend: r._sum.grandTotal || 0,
    }));
  }
}

export default new PurchaseReportRepository();
