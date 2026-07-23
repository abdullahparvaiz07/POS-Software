import { Prisma } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../../../errors";

export class InventoryService {
  async updateStock(
    tx: Prisma.TransactionClient,
    ingredientId: number,
    quantityChange: Prisma.Decimal | number, // Positive for increase, negative for decrease
    newCostPrice?: Prisma.Decimal | number,
    userId?: number
  ) {
    const ingredient = await tx.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundError(`Ingredient with ID ${ingredientId} not found.`);
    }

    if (!ingredient.isActive) {
      throw new BadRequestError(`Ingredient ${ingredient.name} is inactive.`);
    }

    const currentStock = Number(ingredient.currentStock);
    const change = Number(quantityChange);
    const balanceAfter = currentStock + change;

    // Optional: we can add validation here if balanceAfter < 0
    // but for purchasing it's always increasing, so it's fine.

    const updateData: any = {
      currentStock: balanceAfter,
    };

    if (userId) {
      updateData.updatedBy = userId;
    }

    if (newCostPrice !== undefined && newCostPrice !== null) {
      updateData.lastPurchasePrice = newCostPrice;
    }

    const updatedIngredient = await tx.ingredient.update({
      where: { id: ingredientId },
      data: updateData,
    });

    return {
      ingredient: updatedIngredient,
      balanceBefore: currentStock,
      balanceAfter,
    };
  }

  async decreaseStock(
    tx: Prisma.TransactionClient,
    ingredientId: number,
    quantityToDecrease: Prisma.Decimal | number,
    allowNegative: boolean,
    userId?: number
  ) {
    const ingredient = await tx.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundError(`Ingredient with ID ${ingredientId} not found.`);
    }

    if (!ingredient.isActive) {
      throw new BadRequestError(`Ingredient ${ingredient.name} is inactive.`);
    }

    const currentStock = Number(ingredient.currentStock);
    const decrease = Math.abs(Number(quantityToDecrease));
    const balanceAfter = currentStock - decrease;

    if (balanceAfter < 0 && !allowNegative) {
      throw new BadRequestError(`Insufficient stock for ingredient ${ingredient.name}. Required: ${decrease}, Available: ${currentStock}`);
    }

    const updateData: any = {
      currentStock: balanceAfter,
    };

    if (userId) {
      updateData.updatedBy = userId;
    }

    const updatedIngredient = await tx.ingredient.update({
      where: { id: ingredientId },
      data: updateData,
    });

    return {
      ingredient: updatedIngredient,
      balanceBefore: currentStock,
      balanceAfter,
    };
  }
}

export default new InventoryService();
