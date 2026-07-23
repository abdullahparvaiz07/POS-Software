export interface CreateIngredientDto {
  code: string;
  name: string;
  barcode?: string;
  image?: string;
  unitId: number;
  currentStock?: number;
  minimumStock?: number;
  costPrice?: number;
  lastPurchasePrice?: number;
  isPerishable?: boolean;
  isActive?: boolean;
}

export interface UpdateIngredientDto {
  code?: string;
  name?: string;
  barcode?: string;
  image?: string;
  unitId?: number;
  minimumStock?: number;
  costPrice?: number;
  lastPurchasePrice?: number;
  isPerishable?: boolean;
  isActive?: boolean;
}

export interface IngredientQueryDto {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
  unitId?: string;
  isPerishable?: string;
  isActive?: string;
}
