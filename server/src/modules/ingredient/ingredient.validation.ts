import { z } from "zod";

export const createIngredientSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30),
    name: z.string().min(2).max(150),
    barcode: z.string().max(100).optional().nullable(),
    image: z.string().max(255).optional().nullable(),
    unitId: z.number().int().positive(),
    currentStock: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    lastPurchasePrice: z.number().min(0).optional(),
    isPerishable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateIngredientSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).optional(),
    name: z.string().min(2).max(150).optional(),
    barcode: z.string().max(100).optional().nullable(),
    image: z.string().max(255).optional().nullable(),
    unitId: z.number().int().positive().optional(),
    minimumStock: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    lastPurchasePrice: z.number().min(0).optional(),
    isPerishable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});
