import prisma from "../../../config/prisma";

export class FinancialReportRepository {
  async getRevenue(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" as any } : { status: "COMPLETED" as any };
    
    const revenue = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where,
    });
    return revenue._sum.grandTotal || 0;
  }

  async getExpenses(startDate?: Date, endDate?: Date) {
    // Expenses = Purchases for now
    const where = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate }, deletedAt: null } : { deletedAt: null };
    
    const purchases = await prisma.purchase.aggregate({
      _sum: { grandTotal: true },
      where,
    });
    return purchases._sum.grandTotal || 0;
  }

  async getCOGS(startDate?: Date, endDate?: Date) {
    // COGS = sum of (consumed quantity * last purchase price) from order completions
    // Wait, tracking COGS perfectly requires a COGS field on OrderItem or StockMovement.
    // Let's calculate it by summing stock movements of type SALE * ingredient lastPurchasePrice
    // Actually, stockMovement doesn't store price. We can join stockMovement with ingredient.
    
    const dateQuery = startDate && endDate 
      ? Prisma.sql`AND sm.createdAt >= ${startDate} AND sm.createdAt <= ${endDate}` 
      : Prisma.empty;

    const result = await prisma.$queryRaw<[{ cogs: number }]>`
      SELECT SUM(ABS(sm.quantity) * i.lastPurchasePrice) as cogs
      FROM stock_movements sm
      JOIN ingredients i ON sm.ingredientId = i.id
      WHERE sm.movementType = 'SALE' ${dateQuery}
    `;
    
    return Number(result[0].cogs) || 0;
  }

  async getTaxes(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" as any } : { status: "COMPLETED" as any };
    
    const taxes = await prisma.order.aggregate({
      _sum: { taxAmount: true },
      where,
    });
    return taxes._sum.taxAmount || 0;
  }

  async getDiscounts(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" as any } : { status: "COMPLETED" as any };
    
    const discounts = await prisma.order.aggregate({
      _sum: { discountAmount: true },
      _count: { id: true },
      where: { ...where, discountAmount: { gt: 0 } },
    });
    return {
      totalDiscounts: discounts._sum.discountAmount || 0,
      ordersWithDiscounts: discounts._count.id || 0,
    };
  }

  async getPayments(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" as any } : { status: "COMPLETED" as any };
    
    const payments = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _sum: { grandTotal: true },
      where: { ...where },
    });
    
    return payments.map(p => ({
      method: p.paymentMethod,
      amount: p._sum?.grandTotal || 0,
    }));
  }
}

import { Prisma } from "@prisma/client";
export default new FinancialReportRepository();
