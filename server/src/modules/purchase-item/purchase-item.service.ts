import purchaseItemRepository from "./purchase-item.repository";
import purchaseRepository from "../purchase/purchase.repository";
import ingredientRepository from "../ingredient/ingredient.repository";
import { CreatePurchaseItemDto, UpdatePurchaseItemDto } from "./purchase-item.types";
import { PURCHASE_ITEM_MESSAGES } from "./purchase-item.constants";
import { NotFoundError, BadRequestError } from "../../errors";
import { PurchaseStatus } from "@prisma/client";

export class PurchaseItemService {
  private async validatePurchaseEditable(purchaseId: number) {
    const purchase = await purchaseRepository.findById(purchaseId);
    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError(PURCHASE_ITEM_MESSAGES.PURCHASE_NOT_FOUND);
    }
    
    if (purchase.purchaseStatus === PurchaseStatus.RECEIVED || purchase.purchaseStatus === PurchaseStatus.CANCELLED) {
      throw new BadRequestError(PURCHASE_ITEM_MESSAGES.PURCHASE_NOT_EDITABLE);
    }
  }

  private async validateIngredientActive(ingredientId: number) {
    const ingredient = await ingredientRepository.findById(ingredientId);
    if (!ingredient || !ingredient.isActive || ingredient.deletedAt) {
      throw new NotFoundError(PURCHASE_ITEM_MESSAGES.INGREDIENT_NOT_FOUND);
    }
  }

  private calculateTotalCost(quantity: number, unitPrice: number, discountAmount: number = 0, taxAmount: number = 0): number {
    return (quantity * unitPrice) - discountAmount + taxAmount;
  }

  async createPurchaseItem(purchaseId: number, data: CreatePurchaseItemDto) {
    await this.validatePurchaseEditable(purchaseId);
    await this.validateIngredientActive(data.ingredientId);

    const totalCost = this.calculateTotalCost(
      data.quantity,
      data.unitPrice,
      data.discountAmount || 0,
      data.taxAmount || 0
    );

    return purchaseItemRepository.createWithTransaction(purchaseId, { ...data, totalCost });
  }

  async getPurchaseItems(purchaseId: number) {
    return purchaseItemRepository.findMany(purchaseId);
  }

  async getPurchaseItemById(purchaseId: number, itemId: number) {
    const item = await purchaseItemRepository.findById(purchaseId, itemId);
    if (!item) {
      throw new NotFoundError(PURCHASE_ITEM_MESSAGES.NOT_FOUND);
    }
    return item;
  }

  async updatePurchaseItem(purchaseId: number, itemId: number, data: UpdatePurchaseItemDto) {
    await this.validatePurchaseEditable(purchaseId);

    const existingItem = await purchaseItemRepository.findById(purchaseId, itemId);
    if (!existingItem) {
      throw new NotFoundError(PURCHASE_ITEM_MESSAGES.NOT_FOUND);
    }

    if (data.ingredientId && data.ingredientId !== existingItem.ingredientId) {
      await this.validateIngredientActive(data.ingredientId);
    }

    // Recalculate totalCost if relevant fields change
    const quantity = data.quantity ?? Number(existingItem.quantity);
    const unitPrice = data.unitPrice ?? Number(existingItem.unitPrice);
    const discountAmount = data.discountAmount ?? Number(existingItem.discountAmount);
    const taxAmount = data.taxAmount ?? Number(existingItem.taxAmount);

    let totalCost: number | undefined;
    if (
      data.quantity !== undefined || 
      data.unitPrice !== undefined || 
      data.discountAmount !== undefined || 
      data.taxAmount !== undefined
    ) {
      totalCost = this.calculateTotalCost(quantity, unitPrice, discountAmount, taxAmount);
    }

    return purchaseItemRepository.updateWithTransaction(purchaseId, itemId, { ...data, totalCost });
  }

  async deletePurchaseItem(purchaseId: number, itemId: number) {
    await this.validatePurchaseEditable(purchaseId);

    const existingItem = await purchaseItemRepository.findById(purchaseId, itemId);
    if (!existingItem) {
      throw new NotFoundError(PURCHASE_ITEM_MESSAGES.NOT_FOUND);
    }

    return purchaseItemRepository.deleteWithTransaction(purchaseId, itemId);
  }
}

export default new PurchaseItemService();
