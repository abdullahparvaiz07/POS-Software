import { Prisma, OrderStatus, OrderSource, PaymentStatus } from "@prisma/client";
import { CreateOrderDto } from "./order.types";
import { PricingSummary } from "../pricing/pricing.types";
import { OrderBusinessResult } from "./order.business";
import { GeneratedOrderNumber } from "../order-number/orderNumber.types";

class OrderMapper {
  toOrder(
    dto: CreateOrderDto,
    pricing: PricingSummary,
    orderNumberData: GeneratedOrderNumber,
    userId: number
  ): Prisma.OrderUncheckedCreateInput {
    return {
      orderNumber: orderNumberData.orderNumber,
      orderType: dto.orderType,
      takeawayMode: dto.takeawayMode,
      tableNumber: dto.tableNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      assignedStaffId: dto.waiterId || dto.deliveryRiderId || dto.assignedStaffId,
      waiterId: dto.waiterId,
      deliveryRiderId: dto.deliveryRiderId,
      assignedById: (dto.waiterId || dto.deliveryRiderId || dto.assignedStaffId) ? userId : undefined,
      assignedAt: (dto.waiterId || dto.deliveryRiderId || dto.assignedStaffId) ? new Date() : undefined,
      assignmentMethod: dto.assignmentMethod || ((dto.waiterId || dto.deliveryRiderId) ? "MANUAL" : undefined),
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      taxAmount: pricing.taxAmount,
      grandTotal: pricing.grandTotal,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: dto.paymentMethod,
      status: OrderStatus.PENDING,
      source: OrderSource.POS,
      notes: dto.notes,
      createdBy: userId,
      updatedBy: userId,
    };
  }

  toOrderItems(
    orderId: number,
    businessData: OrderBusinessResult,
    pricing: PricingSummary
  ): Prisma.OrderItemCreateManyInput[] {
    return businessData.snapshots.map((snapshot, index) => {
      const itemPricing = pricing.items[index];

      return {
        lineNumber: index + 1,
        orderId,
        menuItemId: snapshot.menuItemId,
        menuVariantId: snapshot.variantId,
        menuItemName: snapshot.menuItemName,
        variantName: snapshot.variantId ? snapshot.variantName : undefined,
        customVariantName: !snapshot.variantId ? snapshot.variantName : undefined,
        customVariantPrice: !snapshot.variantId ? snapshot.unitPrice : undefined,
        preparationArea: snapshot.preparationArea,
        quantity: snapshot.quantity,
        unitPrice: snapshot.unitPrice,
        discountAmount: itemPricing.discountAmount,
        taxAmount: itemPricing.taxAmount,
        subtotal: itemPricing.subtotal,
        notes: snapshot.notes,
      };
    });
  }

  toKitchenQueue(orderItemIds: number[]): Prisma.KitchenQueueCreateManyInput[] {
    return orderItemIds.map(id => ({ orderItemId: id }));
  }

  toBarQueue(orderItemIds: number[]): Prisma.BarQueueCreateManyInput[] {
    return orderItemIds.map(id => ({ orderItemId: id }));
  }
}

export default new OrderMapper();
