export interface PricingItem {
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface PricingResultItem {
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
}

export interface PricingSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  items: PricingResultItem[];
}
