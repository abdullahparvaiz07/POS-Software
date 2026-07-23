import { Prisma, StockMovementType, StockReferenceType } from "@prisma/client";

export class StockMovementService {
  async createMovement(
    tx: Prisma.TransactionClient,
    data: {
      ingredientId: number;
      movementType: StockMovementType;
      referenceType: StockReferenceType;
      referenceId?: number;
      quantity: Prisma.Decimal | number;
      balanceBefore: Prisma.Decimal | number;
      balanceAfter: Prisma.Decimal | number;
      unitCost?: Prisma.Decimal | number;
      totalCost?: Prisma.Decimal | number;
      batchNumber?: string;
      remarks?: string;
      createdBy: number;
    }
  ) {
    return tx.stockMovement.create({
      data,
    });
  }
}

export default new StockMovementService();
