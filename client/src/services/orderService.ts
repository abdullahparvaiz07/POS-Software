import { api } from './api';
import { Order, OrderStatus } from '../types';

export const orderService = {
  mapOrder: (o: any): Order => {
    if (!o) return o;
    return {
      ...o,
      order_number: o.orderNumber || o.order_number,
      order_type: o.orderType || o.order_type,
      takeaway_mode: o.takeawayMode || o.takeaway_mode,
      table_number: o.tableNumber || o.table_number,
      assigned_staff_id: o.assignedStaffId || o.assigned_staff_id,
      waiter_id: o.waiterId || o.waiter_id,
      waiter_name: o.waiter?.fullName || o.waiter_name,
      delivery_rider_id: o.deliveryRiderId || o.delivery_rider_id,
      delivery_rider_name: o.deliveryRider?.fullName || o.delivery_rider_name,
      assigned_by_name: o.assignedBy?.fullName || o.assigned_by_name,
      assigned_at: o.assignedAt || o.assigned_at,
      assignment_method: o.assignmentMethod || o.assignment_method,
      customer_notes: o.customerNotes || o.notes || o.customer_notes,
      total_amount: Number(o.grandTotal || o.total_amount || 0),
      payment_status: o.paymentStatus || o.payment_status,
      status: o.status,
      created_at: o.createdAt || o.created_at,
      items: (o.orderItems || o.items || []).map((item: any) => ({
        ...item,
        menu_item_name: item.menuItemName || item.menu_item_name || (item.menuItem ? item.menuItem.name : ''),
        preparation_area: item.preparationArea ? (item.preparationArea.charAt(0).toUpperCase() + item.preparationArea.slice(1).toLowerCase()) : (item.preparation_area || 'Kitchen'),
        unit_price: Number(item.unitPrice || item.unit_price || 0),
        subtotal: Number(item.subtotal || 0)
      }))
    };
  },

  getAllOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data.data.map(orderService.mapOrder);
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return orderService.mapOrder(response.data.data);
  },

  createOrder: async (data: any): Promise<Order> => {
    const response = await api.post('/orders', data);
    return orderService.mapOrder(response.data.data);
  },

  assignStaff: async (orderId: number, payload: { waiterId?: number; deliveryRiderId?: number; assignmentMethod?: 'MANUAL' | 'AUTO' }): Promise<Order> => {
    const response = await api.patch(`/orders/${orderId}/assign`, payload);
    return orderService.mapOrder(response.data.data);
  },

  getEligibleStaff: async (role: 'WAITER' | 'RIDER'): Promise<any[]> => {
    const response = await api.get(`/orders/eligible-staff?role=${role}`);
    return response.data.data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return orderService.mapOrder(response.data.data);
  },

  triggerPayment: async (id: number, paymentMethod: string = 'CASH'): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/pay`, { paymentMethod });
    return orderService.mapOrder(response.data.data);
  },

  completeOrder: async (id: number): Promise<Order> => {
    const response = await api.post(`/orders/${id}/complete`);
    return orderService.mapOrder(response.data.data);
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return orderService.mapOrder(response.data.data);
  }
};
