import prisma from "../../config/prisma";
import { CreateOrderDto, CreateOrderItemDto } from "./order.types";
import { PricingItem } from "../pricing/pricing.types";
import { BadRequestError, NotFoundError, ConflictError } from "../../errors";
import { OrderType, PreparationArea, PricingMode } from "@prisma/client";

export interface OrderItemSnapshot {
  menuItemId: number;
  menuItemName: string;
  variantId?: number;
  variantName: string;
  unitPrice: number;
  quantity: number;
  preparationArea: PreparationArea;
  notes?: string;
}

export interface OrderBusinessResult {
  snapshots: OrderItemSnapshot[];
  pricingItems: PricingItem[];
  kitchenItems: OrderItemSnapshot[];
  barItems: OrderItemSnapshot[];
}

class OrderBusiness {
  async validateOrder(dto: CreateOrderDto): Promise<OrderBusinessResult> {
    const menuItemsMap = await this.validateMenuItems(dto.items);
    this.validateVariants(dto.items, menuItemsMap);
    this.validateAvailability(dto.items, menuItemsMap);
    
    if (dto.assignedStaffId) {
      await this.validateAssignedStaff(dto.assignedStaffId, dto.orderType);
    }

    const snapshots = this.buildOrderSnapshot(dto.items, menuItemsMap);
    const pricingItems = this.preparePricingItems(snapshots, dto.discountPercent, dto.taxPercent);
    
    const kitchenItems = snapshots.filter(s => s.preparationArea === PreparationArea.KITCHEN);
    const barItems = snapshots.filter(s => s.preparationArea === PreparationArea.BAR);

    return {
      snapshots,
      pricingItems,
      kitchenItems,
      barItems,
    };
  }

  private async validateMenuItems(items: CreateOrderItemDto[]) {
    // Unique menuItemIds to avoid N+1 queries
    const itemIds = [...new Set(items.map(i => i.menuItemId))];
    
    // Eager load variants to avoid secondary queries for variant validation
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: { variants: true }
    });

    const menuItemsMap = new Map<number, any>();
    menuItems.forEach(item => menuItemsMap.set(item.id, item));

    // Verify all requested items exist and are not deleted
    for (const id of itemIds) {
      const item = menuItemsMap.get(id);
      if (!item) {
        throw new NotFoundError(`Menu item with ID ${id} not found.`);
      }
      if (item.deletedAt) {
        throw new ConflictError(`Menu item '${item.name}' is deleted.`);
      }
    }

    return menuItemsMap;
  }

  private validateVariants(items: CreateOrderItemDto[], menuItemsMap: Map<number, any>) {
    for (const item of items) {
      const menuItem = menuItemsMap.get(item.menuItemId)!;

      if (item.menuVariantId) {
        // Find variant locally from eager-loaded relation
        const variant = menuItem.variants.find((v: any) => v.id === item.menuVariantId);
        if (!variant) {
          throw new ConflictError(`Variant with ID ${item.menuVariantId} does not belong to menu item '${menuItem.name}'.`);
        }
      } 
      else if (item.customVariantName && item.customVariantName !== 'Regular') {
        if (menuItem.pricingMode !== PricingMode.VARIANTS_WITH_CUSTOM && menuItem.pricingMode !== PricingMode.SINGLE_PRICE) {
           throw new ConflictError(`Menu item '${menuItem.name}' does not allow custom variants.`);
        }
      }
    }
  }

  private validateAvailability(items: CreateOrderItemDto[], menuItemsMap: Map<number, any>) {
    for (const item of items) {
      const menuItem = menuItemsMap.get(item.menuItemId)!;
      if (!menuItem.isAvailable) {
        throw new ConflictError(`Menu item '${menuItem.name}' is currently unavailable.`);
      }

      if (item.menuVariantId) {
        const variant = menuItem.variants.find((v: any) => v.id === item.menuVariantId)!;
        if (!variant.isAvailable) {
          throw new ConflictError(`Variant '${variant.name}' for '${menuItem.name}' is out of stock.`);
        }
      }
    }
  }

  private async validateAssignedStaff(staffId: number, orderType: OrderType) {
    const user = await prisma.user.findUnique({
      where: { id: staffId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError("Assigned staff member not found.");
    }
    if (user.status !== "ACTIVE" || user.deletedAt) {
      throw new ConflictError("Assigned staff member is inactive or deleted.");
    }

    const roleNames = user.userRoles.map(ur => ur.role.name.toUpperCase());

    if (orderType === OrderType.DELIVERY) {
      if (!roleNames.includes("RIDER")) {
        throw new ConflictError("Assigned staff must have the RIDER role for delivery orders.");
      }
    } else {
      if (!roleNames.includes("WAITER") && !roleNames.includes("ADMIN") && !roleNames.includes("MANAGER")) {
        throw new ConflictError("Assigned staff must be a WAITER to serve this order type.");
      }
    }
  }

  private buildOrderSnapshot(items: CreateOrderItemDto[], menuItemsMap: Map<number, any>): OrderItemSnapshot[] {
    return items.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId)!;

      let variantName = "";
      let unitPrice = 0;
      let variantId: number | undefined = undefined;

      if (item.menuVariantId) {
        // Predefined variant
        const variant = menuItem.variants.find((v: any) => v.id === item.menuVariantId)!;
        variantName = variant.name;
        unitPrice = Number(variant.price);
        variantId = variant.id;
      } else if (item.customVariantName && item.customVariantPrice !== undefined) {
        // Custom variant
        variantName = item.customVariantName;
        unitPrice = item.customVariantPrice;
      } else if (menuItem.pricingMode === PricingMode.SINGLE_PRICE) {
        // Single price item -> use its default variant implicitly
        const variant = menuItem.variants[0];
        variantName = variant.name;
        unitPrice = Number(variant.price);
        variantId = variant.id;
      }

      return {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        variantId,
        variantName,
        unitPrice,
        quantity: item.quantity,
        preparationArea: menuItem.preparationArea as PreparationArea,
        notes: item.notes
      };
    });
  }

  private preparePricingItems(snapshots: OrderItemSnapshot[], discountPercent: number = 0, taxPercent: number = 0): PricingItem[] {
    return snapshots.map(s => {
      const baseTotal = s.quantity * s.unitPrice;
      const discountAmount = baseTotal * (discountPercent / 100);
      const subtotalAfterDiscount = baseTotal - discountAmount;
      const taxAmount = subtotalAfterDiscount * (taxPercent / 100);

      return {
        menuItemId: s.menuItemId,
        menuItemName: s.menuItemName,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        discountAmount,
        taxAmount,
      };
    });
  }
}

export default new OrderBusiness();
