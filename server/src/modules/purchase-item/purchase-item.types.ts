export interface CreatePurchaseItemDto {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  expiryDate?: string | Date;
  batchNumber?: string;
  notes?: string;
}

export interface UpdatePurchaseItemDto {
  ingredientId?: number;
  quantity?: number;
  unitPrice?: number;
  discountAmount?: number;
  taxAmount?: number;
  expiryDate?: string | Date;
  batchNumber?: string;
  notes?: string;
}

// totalCost will be calculated as (quantity * unitPrice) - discountAmount + taxAmount
