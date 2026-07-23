import { z } from "zod";
import { PaymentStatus, PurchaseStatus } from "@prisma/client";

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive(),
    purchaseNumber: z.string().max(50).optional(),
    invoiceNumber: z.string().max(100).optional().nullable(),
    purchaseDate: z.string().datetime().or(z.date()),
    expectedDate: z.string().datetime().or(z.date()).optional().nullable(),
    subtotal: z.number().min(0),
    discountAmount: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    shippingCost: z.number().min(0).optional(),
    grandTotal: z.number().min(0),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    purchaseStatus: z.nativeEnum(PurchaseStatus).optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const updatePurchaseSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive().optional(),
    purchaseNumber: z.string().max(50).optional(),
    invoiceNumber: z.string().max(100).optional().nullable(),
    purchaseDate: z.string().datetime().or(z.date()).optional(),
    expectedDate: z.string().datetime().or(z.date()).optional().nullable(),
    subtotal: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    shippingCost: z.number().min(0).optional(),
    grandTotal: z.number().min(0).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    purchaseStatus: z.nativeEnum(PurchaseStatus).optional(),
    notes: z.string().optional().nullable(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});
