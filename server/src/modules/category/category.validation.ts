import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().trim().max(1000).optional().nullable(),
  icon: z.string().trim().max(100).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  image: z.string().trim().max(255).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();
