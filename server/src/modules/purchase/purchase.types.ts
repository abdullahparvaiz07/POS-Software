import { PaymentStatus, PurchaseStatus } from "@prisma/client";

export interface CreatePurchaseDto {
  supplierId: number;
  purchaseNumber?: string;
  invoiceNumber?: string;
  purchaseDate: string | Date;
  expectedDate?: string | Date;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  grandTotal: number;
  paymentStatus?: PaymentStatus;
  purchaseStatus?: PurchaseStatus;
  notes?: string;
}

export interface UpdatePurchaseDto {
  supplierId?: number;
  purchaseNumber?: string;
  invoiceNumber?: string;
  purchaseDate?: string | Date;
  expectedDate?: string | Date;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  grandTotal?: number;
  paymentStatus?: PaymentStatus;
  purchaseStatus?: PurchaseStatus;
  notes?: string;
}

export interface PurchaseQueryDto {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
  status?: PurchaseStatus;
  paymentStatus?: PaymentStatus;
  supplierId?: string;
  from?: string;
  to?: string;
}
