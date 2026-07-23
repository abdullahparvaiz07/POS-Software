import { z } from "zod";
import { OrderType, TakeawayMode, PaymentMethod, OrderStatus } from "@prisma/client";

const orderItemSchema = z.object({
  menuItemId: z.number().int().positive("Menu item ID is required"),
  menuVariantId: z.number().int().positive().optional(),
  customVariantName: z.string().trim().max(100).optional(),
  customVariantPrice: z.number().positive().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100, "Maximum quantity per item is 100"),
  notes: z.string().max(500).optional(),
});

export const createOrderSchema = z
  .object({
    orderType: z.nativeEnum(OrderType),
    takeawayMode: z.nativeEnum(TakeawayMode).optional(),
    tableNumber: z.number().int().positive().optional(),
    customerName: z.string().trim().max(150).optional(),
    customerPhone: z.string().trim().max(20).optional(),
    assignedStaffId: z.number().int().positive().optional(),
    waiterId: z.number().int().positive().optional(),
    deliveryRiderId: z.number().int().positive().optional(),
    assignmentMethod: z.enum(["MANUAL", "AUTO"]).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    notes: z.string().max(500).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    taxPercent: z.number().min(0).max(100).optional(),
    items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  })
  .superRefine((data, ctx) => {
    // Rule 1: DINE_IN requires tableNumber
    if (data.orderType === OrderType.DINE_IN && !data.tableNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table number is required for Dine-In orders.",
        path: ["tableNumber"],
      });
    }

    // Rule 2: TAKEAWAY requires takeawayMode
    if (data.orderType === OrderType.TAKEAWAY && !data.takeawayMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Takeaway mode is required for Takeaway orders.",
        path: ["takeawayMode"],
      });
    }

    // Rule 3: DELIVERY requires customerName and customerPhone
    if (data.orderType === OrderType.DELIVERY) {
      if (!data.customerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer name is required for Delivery orders.",
          path: ["customerName"],
        });
      }
      if (!data.customerPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer phone is required for Delivery orders.",
          path: ["customerPhone"],
        });
      }
    }

    // Validate Items
    const uniqueItemSignatures = new Set<string>();

    data.items.forEach((item, index) => {
      // Rule 4: Custom variant requires both name and price
      const hasCustomName = !!item.customVariantName;
      const hasCustomPrice = item.customVariantPrice !== undefined;

      if (hasCustomName !== hasCustomPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom variants must include both a name and a price.",
          path: ["items", index, "customVariantName"],
        });
      }

      // Rule 5: Reject if both menuVariantId and custom variant exist
      if (item.menuVariantId && (hasCustomName || hasCustomPrice)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "An item cannot have both a predefined variant and a custom variant.",
          path: ["items", index],
        });
      }

      // Rule 6: Duplicate Items check (same menuItemId + same variant config)
      const variantKey = item.menuVariantId 
        ? `v_${item.menuVariantId}` 
        : hasCustomName 
          ? `c_${item.customVariantName}` 
          : "default";
          
      const signature = `${item.menuItemId}_${variantKey}`;

      if (uniqueItemSignatures.has(signature)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate items detected. Please increase the quantity of the existing item instead.",
          path: ["items", index],
        });
      }
      uniqueItemSignatures.add(signature);
    });
  });

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const markPaidSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const assignStaffSchema = z.object({
  assignedStaffId: z.number().int().positive().optional(),
  waiterId: z.number().int().positive().optional(),
  deliveryRiderId: z.number().int().positive().optional(),
  assignmentMethod: z.enum(["MANUAL", "AUTO"]).optional(),
});
