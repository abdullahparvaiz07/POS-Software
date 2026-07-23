import { OrderType, TakeawayMode, PaymentMethod, OrderStatus } from "@prisma/client";

export interface CreateOrderItemDto {
  menuItemId: number;
  menuVariantId?: number;
  customVariantName?: string;
  customVariantPrice?: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDto {
  orderType: OrderType;
  takeawayMode?: TakeawayMode;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  assignedStaffId?: number;
  waiterId?: number;
  deliveryRiderId?: number;
  assignmentMethod?: 'MANUAL' | 'AUTO';
  paymentMethod: PaymentMethod;
  notes?: string;
  discountPercent?: number;
  taxPercent?: number;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface OrderFilterDto {
  status?: OrderStatus;
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}
