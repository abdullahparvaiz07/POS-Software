/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CapabilityType = 'Admin' | 'Manager' | 'Cashier' | 'Kitchen' | 'Bar' | 'Waiter' | 'Rider';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
  joining_date: string;
  status: UserStatus;
  created_at: string;
  photo?: string;
  capabilities: CapabilityType[];
  last_active?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: 'Active' | 'Inactive';
  isCustom?: boolean;
  created_at: string;
  items_count?: number;
}

export type PreparationArea = 'Kitchen' | 'Bar';

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  preparation_area: PreparationArea;
  image: string;
  is_available: boolean;
  created_at: string;
  variants?: any[];
}

export type OrderType = 'Dine-In' | 'Takeaway' | 'Delivery';
export type TakeawayMode = 'Counter' | 'Car';
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type AssignedRole = 'Waiter' | 'Rider';

export interface Order {
  id: number;
  order_number: string;
  order_type: OrderType;
  takeaway_mode: TakeawayMode | null;
  table_number: number | null;
  assigned_staff_id: number | null;
  assigned_role: AssignedRole | null;
  waiter_id?: number | null;
  waiter_name?: string | null;
  delivery_rider_id?: number | null;
  delivery_rider_name?: string | null;
  assigned_by_name?: string | null;
  assigned_at?: string | null;
  assignment_method?: 'MANUAL' | 'AUTO' | null;
  customer_notes?: string;
  total_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  // Included fields for convenience
  menu_item_name?: string;
  preparation_area?: PreparationArea;
}

export type QueueItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed';

export interface QueueItem {
  id: number;
  order_item_id: number;
  order_id: number;
  order_number: string;
  menu_item_name: string;
  quantity: number;
  notes?: string;
  status: QueueItemStatus;
  created_at: string;
  updated_at: string;
  assigned_staff_id: number | null;
}

export interface DashboardStats {
  todayRevenue: number;
  cashInHand: number;
  totalOrders: number;
  dineInOrders: number;
  takeawayOrders: number;
  deliveryOrders: number;
  cancelledOrders: number;
  cancelledRevenue: number;
  creditOrders: number;
  creditedAmount: number;
  kitchenQueueCount: number;
  barQueueCount: number;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Activity {
  id: string;
  time: string;
  actor: string;
  description: string;
  type?: 'payment' | 'completed' | 'preparing' | 'assigned' | 'created' | 'cancelled' | 'system' | 'printer' | 'status_change';
  title?: string;
  amount?: number;
}
