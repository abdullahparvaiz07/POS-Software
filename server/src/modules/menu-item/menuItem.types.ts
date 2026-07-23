export interface CreateRecipeItemDto {
  ingredientId: number;
  quantity: number;
}

export interface CreateMenuVariantDto {
  name: string;
  price: number;
  displayOrder?: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  image?: string;
  barcode?: string;
  sku?: string;
  preparationTime?: number;
  recipe?: {
    recipeItems: CreateRecipeItemDto[];
  };
}

export interface CreateMenuItemDto {
  categoryId: number;
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  preparationArea: "KITCHEN" | "BAR";
  pricingMode: "SINGLE_PRICE" | "MULTIPLE_VARIANTS" | "VARIANTS_WITH_CUSTOM";
  displayOrder?: number;
  isAvailable?: boolean;
  sizeTemplateId?: number;
  modifierGroupIds?: number[];
  variants: CreateMenuVariantDto[];
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {}
