import inventoryReportRepository from "./inventory-report.repository";
import { BadRequestError } from "../../../errors";

export class InventoryReportService {
  async getSummary() {
    return inventoryReportRepository.getSummary();
  }

  async getCurrentStock(page: number = 1, limit: number = 10, categoryId?: number) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    
    const result = await inventoryReportRepository.getCurrentStock(page, limit, categoryId);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      }
    };
  }

  async getLowStock() {
    // Raw query result might have Decimal types, converting to standard numbers is usually handled by the response serialization,
    // but Prisma raw queries sometimes return BigInt which JSON.stringify can't handle.
    const result = await inventoryReportRepository.getLowStock();
    return result.map(item => ({
      ...item,
      currentStock: Number(item.currentStock),
      minimumStock: Number(item.minimumStock),
    }));
  }

  async getMovements(page: number = 1, limit: number = 10, startDate?: string, endDate?: string, ingredientId?: number) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError("Invalid date format.");
      }
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
    }

    const result = await inventoryReportRepository.getMovements(page, limit, start, end, ingredientId);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      }
    };
  }

  async getValuation() {
    const result = await inventoryReportRepository.getValuation();
    return result.map(item => ({
      ...item,
      currentStock: Number(item.currentStock),
      lastPurchasePrice: Number(item.lastPurchasePrice),
      totalValue: Number(item.totalValue),
    }));
  }
}

export default new InventoryReportService();
