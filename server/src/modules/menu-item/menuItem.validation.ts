import { z } from "zod";

const recipeItemSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const recipeSchema = z.object({
  recipeItems: z.array(recipeItemSchema).min(1, "Recipe must have at least one ingredient"),
});

const variantSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(1, "Variant name is required"),
  price: z.number().min(0, "Price cannot be negative"),
  displayOrder: z.number().optional(),
  isDefault: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  image: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  preparationTime: z.number().int().min(0).optional(),
  recipe: recipeSchema.optional(),
});

const baseMenuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  preparationArea: z.enum(["KITCHEN", "BAR"]),
  pricingMode: z.enum(["SINGLE_PRICE", "MULTIPLE_VARIANTS", "VARIANTS_WITH_CUSTOM"]),
  displayOrder: z.number().optional(),
  isAvailable: z.boolean().optional(),
  sizeTemplateId: z.number().int().positive().optional().nullable(),
  modifierGroupIds: z.array(z.number().int().positive()).optional(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

const validateVariantsRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (data.variants) {
    // Rule 1: SINGLE_PRICE -> exactly one variant
    // We only check this if pricingMode is also available (always true for create, might be missing on update)
    if (data.pricingMode === "SINGLE_PRICE" && data.variants.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SINGLE_PRICE mode must have exactly one variant.",
        path: ["variants"],
      });
    }

    // Rule 3: Only one variant may be default
    const defaultVariants = data.variants.filter((v: any) => v.isDefault);
    if (defaultVariants.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one variant can be set as default.",
        path: ["variants"],
      });
    }

    // Rule 5: Unique variant names
    const variantNames = data.variants.map((v: any) => v.name?.toLowerCase());
    const uniqueNames = new Set(variantNames);
    if (uniqueNames.size !== variantNames.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variant names must be unique within a menu item.",
        path: ["variants"],
      });
    }
  }
};

export const createMenuItemSchema = baseMenuItemSchema.superRefine(validateVariantsRefinement);

export const updateMenuItemSchema = baseMenuItemSchema.partial().superRefine(validateVariantsRefinement);
