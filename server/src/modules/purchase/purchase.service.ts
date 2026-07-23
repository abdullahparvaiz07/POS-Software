import purchaseRepository from "./purchase.repository";
import supplierRepository from "../supplier/supplier.repository";
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseQueryDto } from "./purchase.types";
import { PURCHASE_MESSAGES } from "./purchase.constants";
import { ConflictError, NotFoundError, BadRequestError } from "../../errors";
import { SupplierStatus, PurchaseStatus, StockMovementType, StockReferenceType } from "@prisma/client";
import prisma from "../../config/prisma";
import inventoryService from "../inventory/services/inventory.service";
import stockMovementService from "../inventory/services/stock-movement.service";
import { socketService } from "../../websocket/socket.service";
import { SOCKET_EVENTS } from "../../websocket/socket.events";
import { SOCKET_ROOMS } from "../../websocket/socket.rooms";

export class PurchaseService {
  private generatePurchaseNumber(): string {
    return `PUR-${Date.now()}`; // Simplified generator
  }

  async createPurchase(data: CreatePurchaseDto, userId: number) {
    // Validate supplier
    const supplier = await supplierRepository.findById(data.supplierId);
    if (!supplier || supplier.status !== SupplierStatus.ACTIVE) {
      throw new NotFoundError(PURCHASE_MESSAGES.SUPPLIER_NOT_FOUND);
    }

    if (data.purchaseNumber) {
      const existing = await purchaseRepository.findByNumber(data.purchaseNumber);
      if (existing) {
        throw new ConflictError(PURCHASE_MESSAGES.DUPLICATE_NUMBER);
      }
    } else {
      data.purchaseNumber = this.generatePurchaseNumber();
    }

    return purchaseRepository.create(data, userId);
  }

  async getPurchases(query: PurchaseQueryDto) {
    return purchaseRepository.findMany(query);
  }

  async getPurchaseById(id: number) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError(PURCHASE_MESSAGES.NOT_FOUND);
    }
    return purchase;
  }

  async updatePurchase(id: number, data: UpdatePurchaseDto, userId: number) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError(PURCHASE_MESSAGES.NOT_FOUND);
    }

    if (purchase.purchaseStatus === PurchaseStatus.RECEIVED || purchase.purchaseStatus === PurchaseStatus.CANCELLED) {
      throw new BadRequestError(PURCHASE_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    if (data.supplierId && data.supplierId !== purchase.supplierId) {
      const supplier = await supplierRepository.findById(data.supplierId);
      if (!supplier || supplier.status !== SupplierStatus.ACTIVE) {
        throw new NotFoundError(PURCHASE_MESSAGES.SUPPLIER_NOT_FOUND);
      }
    }

    if (data.purchaseNumber && data.purchaseNumber !== purchase.purchaseNumber) {
      const existing = await purchaseRepository.findByNumber(data.purchaseNumber);
      if (existing) {
        throw new ConflictError(PURCHASE_MESSAGES.DUPLICATE_NUMBER);
      }
    }

    return purchaseRepository.update(id, data, userId);
  }

  async deletePurchase(id: number, userId: number) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError(PURCHASE_MESSAGES.NOT_FOUND);
    }

    if (purchase.purchaseStatus === PurchaseStatus.RECEIVED || purchase.purchaseStatus === PurchaseStatus.CANCELLED) {
      throw new BadRequestError(PURCHASE_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    return purchaseRepository.softDelete(id, userId);
  }

  async receivePurchase(id: number, userId: number) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate Purchase & Get Items
      const purchase = await tx.purchase.findUnique({
        where: { id },
        include: { purchaseItems: true },
      });

      if (!purchase || purchase.deletedAt) {
        throw new NotFoundError(PURCHASE_MESSAGES.NOT_FOUND);
      }

      if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
        throw new BadRequestError(PURCHASE_MESSAGES.ALREADY_RECEIVED);
      }
      if (purchase.purchaseStatus === PurchaseStatus.CANCELLED) {
        throw new BadRequestError(PURCHASE_MESSAGES.ALREADY_CANCELLED);
      }
      if (purchase.purchaseStatus !== PurchaseStatus.PENDING) {
        throw new BadRequestError(PURCHASE_MESSAGES.NOT_PENDING);
      }

      if (!purchase.purchaseItems || purchase.purchaseItems.length === 0) {
        throw new BadRequestError(PURCHASE_MESSAGES.NO_ITEMS);
      }

      // 2. Process Items
      for (const item of purchase.purchaseItems) {
        // Update Ingredient
        const { balanceBefore, balanceAfter } = await inventoryService.updateStock(
          tx,
          item.ingredientId,
          item.quantity,
          item.unitPrice,
          userId
        );

        // Insert Stock Movement
        await stockMovementService.createMovement(tx, {
          ingredientId: item.ingredientId,
          movementType: StockMovementType.PURCHASE,
          referenceType: StockReferenceType.PURCHASE,
          referenceId: purchase.id,
          quantity: item.quantity,
          balanceBefore,
          balanceAfter,
          unitCost: item.unitPrice,
          totalCost: item.totalCost,
          createdBy: userId,
        });
      }

      // 3. Update Purchase Status
      return tx.purchase.update({
        where: { id },
        data: {
          purchaseStatus: PurchaseStatus.RECEIVED,
          receivedBy: userId,
          receivedAt: new Date(),
          updatedBy: userId,
        },
        include: { purchaseItems: true },
      });
    });

    // Broadcast updates
    socketService.emitToRoom(SOCKET_ROOMS.MANAGER, SOCKET_EVENTS.PURCHASE_RECEIVED, result);
    socketService.emitToRoom(SOCKET_ROOMS.INVENTORY, SOCKET_EVENTS.INVENTORY_UPDATED, result);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, {});

    return result;
  }
}

export default new PurchaseService();
