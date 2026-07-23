import { z } from "zod";

export const createSizeTemplateItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  displayOrder: z.number().int().min(0).optional(),
});

export const createSizeTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  items: z.array(createSizeTemplateItemSchema).min(1, "At least one size is required"),
});

export const updateSizeTemplateSchema = createSizeTemplateSchema.partial();
