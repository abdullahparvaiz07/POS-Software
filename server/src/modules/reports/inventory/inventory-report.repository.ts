import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";

export class InventoryReportRepository {
  async getSummary() {
    const totalItems = await prisma.ingredient.count({ where: { isActive: true, deletedAt: null } });
    
    // Low stock where currentStock > 0 but <= minimumStock
    const lowStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM ingredients WHERE currentStock <= minimumStock AND currentStock > 0 AND isActive = true AND deletedAt IS NULL
    `;
    
    // Out of stock where currentStock = 0
    const outOfStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM ingredients WHERE currentStock <= 0 AND isActive = true AND deletedAt IS NULL
    `;
    
    // Total valuation: sum of (currentStock * lastPurchasePrice)
    const valuationResult = await prisma.$queryRaw<[{ valuation: number }]>`
      SELECT SUM(currentStock * lastPurchasePrice) as valuation FROM ingredients WHERE currentStock > 0 AND isActive = true AND deletedAt IS NULL
    `;

    return {
      totalItems,
      lowStockItems: Number(lowStockResult[0].count),
      outOfStockItems: Number(outOfStockResult[0].count),
      totalValuation: Number(valuationResult[0].valuation) || 0,
    };
  }

  async getCurrentStock(page: number, limit: number, categoryId?: number) {
    const where: Prisma.IngredientWhereInput = { isActive: true, deletedAt: null };
    // categoryId doesn't exist on Ingredient, skipping for now

    const [data, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          currentStock: true,
          minimumStock: true,
          unit: { select: { name: true, shortName: true } }
        },
        orderBy: { name: "asc" }
      }),
      prisma.ingredient.count({ where })
    ]);

    return { data, total };
  }

  async getLowStock() {
    const data = await prisma.$queryRaw<any[]>`
      SELECT i.id, i.name, i.currentStock, i.minimumStock, u.shortName as unitSymbol, 'General' as categoryName
      FROM ingredients i
      LEFT JOIN units u ON i.unitId = u.id
      WHERE i.currentStock <= i.minimumStock AND i.isActive = true AND i.deletedAt IS NULL
      ORDER BY (i.currentStock - i.minimumStock) ASC
    `;
    return data;
  }

  async getMovements(page: number, limit: number, startDate?: Date, endDate?: Date, ingredientId?: number) {
    const where: Prisma.StockMovementWhereInput = {};
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }
    if (ingredientId) {
      where.ingredientId = ingredientId;
    }

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ingredient: { select: { name: true, unit: { select: { shortName: true } } } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return { data, total };
  }

  async getValuation() {
    const data = await prisma.$queryRaw<any[]>`
      SELECT i.id, i.name, i.currentStock, i.lastPurchasePrice, (i.currentStock * i.lastPurchasePrice) as totalValue, u.shortName as unitSymbol, 'General' as categoryName
      FROM ingredients i
      LEFT JOIN units u ON i.unitId = u.id
      WHERE i.currentStock > 0 AND i.isActive = true AND i.deletedAt IS NULL
      ORDER BY (i.currentStock * i.lastPurchasePrice) DESC
    `;
    return data;
  }
}

export default new InventoryReportRepository();
