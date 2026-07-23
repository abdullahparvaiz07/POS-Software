import prisma from "../../config/prisma";
import { CreatePurchaseItemDto, UpdatePurchaseItemDto } from "./purchase-item.types";

export class PurchaseItemRepository {
  private async calculateAndUpdatePurchaseTotals(tx: any, purchaseId: number) {
    // Get all items for this purchase to calculate subtotal
    const items = await tx.purchaseItem.findMany({
      where: { purchaseId },
    });

    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.totalCost), 0);

    // Get the purchase to apply its own discounts/taxes/shipping
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) return;

    const discountAmount = Number(purchase.discountAmount || 0);
    const taxAmount = Number(purchase.taxAmount || 0);
    const shippingCost = Number(purchase.shippingCost || 0);

    const grandTotal = subtotal - discountAmount + taxAmount + shippingCost;

    // Update the purchase
    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        subtotal,
        grandTotal,
      },
    });
  }

  async createWithTransaction(purchaseId: number, data: CreatePurchaseItemDto & { totalCost: number }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.purchaseItem.create({
        data: {
          purchaseId,
          ingredientId: data.ingredientId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discountAmount: data.discountAmount || 0,
          taxAmount: data.taxAmount || 0,
          totalCost: data.totalCost,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          batchNumber: data.batchNumber,
          notes: data.notes,
        },
      });

      await this.calculateAndUpdatePurchaseTotals(tx, purchaseId);

      return item;
    });
  }

  async updateWithTransaction(purchaseId: number, itemId: number, data: UpdatePurchaseItemDto & { totalCost?: number }) {
    return prisma.$transaction(async (tx) => {
      const updateData: any = { ...data };
      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
      }

      const item = await tx.purchaseItem.update({
        where: { id: itemId },
        data: updateData,
      });

      await this.calculateAndUpdatePurchaseTotals(tx, purchaseId);

      return item;
    });
  }

  async deleteWithTransaction(purchaseId: number, itemId: number) {
    return prisma.$transaction(async (tx) => {
      await tx.purchaseItem.delete({
        where: { id: itemId },
      });

      await this.calculateAndUpdatePurchaseTotals(tx, purchaseId);
    });
  }

  async findById(purchaseId: number, itemId: number) {
    return prisma.purchaseItem.findFirst({
      where: {
        id: itemId,
        purchaseId: purchaseId,
      },
      include: {
        ingredient: true,
      },
    });
  }

  async findMany(purchaseId: number) {
    return prisma.purchaseItem.findMany({
      where: { purchaseId },
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default new PurchaseItemRepository();
