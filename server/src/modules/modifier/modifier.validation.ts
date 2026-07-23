import { z } from "zod";

export const createModifierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  price: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export const createModifierGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  modifiers: z.array(createModifierSchema).min(1, "At least one modifier is required"),
});

export const updateModifierGroupSchema = createModifierGroupSchema.partial();
