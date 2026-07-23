import { z } from "zod";

export const createPurchaseItemSchema = z.object({
  body: z.object({
    ingredientId: z.number().int().positive(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    discountAmount: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
    batchNumber: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updatePurchaseItemSchema = z.object({
  body: z.object({
    ingredientId: z.number().int().positive().optional(),
    quantity: z.number().positive().optional(),
    unitPrice: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
    batchNumber: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});
