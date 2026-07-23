/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Order, OrderStatus, OrderType } from '../../types';
import { formatPKR } from './StatisticsCards';
import { orderService } from '../../services/orderService';
import { 
  Receipt, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Coffee,
  Package,
  Bike,
  UserCheck,
  UserPlus,
  Zap,
  User as UserIcon,
  RotateCw
} from 'lucide-react';

interface OrdersViewProps {
  onViewOrder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onViewOrder }) => {
  const { orders, users, cancelOrder, completeOrder, triggerPayment, updateOrderStatus, refreshOrdersAndQueues, addNotification } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Reassign Modal State
  const [reassignOrder, setReassignOrder] = useState<Order | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(undefined);
  const [reassignMethod, setReassignMethod] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStaffName = (staffId: number | null) => {
    if (!staffId) return 'Unassigned';
    const s = users.find(member => member.id === staffId);
    return s ? s.full_name : 'Unassigned';
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'Dine-In': return <Coffee className="h-4 w-4 text-sky-500" />;
      case 'Takeaway': return <Package className="h-4 w-4 text-amber-500" />;
      case 'Delivery': return <Bike className="h-4 w-4 text-emerald-500" />;
    }
  };

  // Helper to format assigned staff display
  const getStaffDisplay = (order: Order) => {
    if (order.order_type === 'Dine-In') {
      const waiterName = order.waiter_name || getStaffName(order.assigned_staff_id);
      return {
        label: 'Waiter',
        name: waiterName || 'Auto Waiter',
        method: order.assignment_method || 'AUTO'
      };
    }
    if (order.order_type === 'Delivery') {
      const riderName = order.delivery_rider_name || getStaffName(order.assigned_staff_id);
      return {
        label: 'Delivery Rider',
        name: riderName || 'Auto Rider',
        method: order.assignment_method || 'AUTO'
      };
    }
    return {
      label: 'Staff',
      name: 'Counter Pickup',
      method: 'MANUAL'
    };
  };

  // Filter orders based on sub-tabs & search
  const filteredOrders = orders.filter(o => {
    const staffInfo = getStaffDisplay(o);
    const matchesSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          staffInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.customer_notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeSubTab === 'active') {
      return o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready';
    }
    if (activeSubTab === 'completed') {
      return o.status === 'Completed';
    }
    if (activeSubTab === 'cancelled') {
      return o.status === 'Cancelled';
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">Pending</span>;
      case 'Preparing':
        return <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-200">Preparing</span>;
      case 'Ready':
        return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200 animate-bounce">Ready</span>;
      case 'Completed':
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">Completed</span>;
      case 'Cancelled':
        return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-200">Cancelled</span>;
    }
  };

  const handleSaveReassignment = async () => {
    if (!reassignOrder) return;
    setIsSubmitting(true);
    try {
      const isDineIn = reassignOrder.order_type === 'Dine-In';
      const isDelivery = reassignOrder.order_type === 'Delivery';

      const payload = {
        waiterId: isDineIn && reassignMethod === 'MANUAL' ? selectedStaffId : undefined,
        deliveryRiderId: isDelivery && reassignMethod === 'MANUAL' ? selectedStaffId : undefined,
        assignmentMethod: reassignMethod
      };

      await orderService.assignStaff(reassignOrder.id, payload);
      await refreshOrdersAndQueues();
      addNotification('success', `Staff reassigned for Order #${reassignOrder.order_number}`);
      setReassignOrder(null);
    } catch (err: any) {
      addNotification('error', `Failed to reassign staff: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get eligible staff for modal based on order type (supporting multiple roles)
  const getEligibleModalStaff = () => {
    if (!reassignOrder) return [];
    if (reassignOrder.order_type === 'Dine-In') {
      return users.filter(u => 
        u.capabilities?.includes('Waiter') || 
        (u as any).userRoles?.some((ur: any) => ur.role?.name?.toLowerCase().includes('waiter'))
      );
    }
    if (reassignOrder.order_type === 'Delivery') {
      return users.filter(u => 
        u.capabilities?.includes('Rider') || 
        (u as any).userRoles?.some((ur: any) => ur.role?.name?.toLowerCase().includes('rider'))
      );
    }
    return [];
  };

  const modalStaffList = getEligibleModalStaff();

  // Counts for stats banner
  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length
  };

  return (
    <div id="full-orders-view" className="space-y-6">
      
      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100">
            <Receipt className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs</span>
            <span className="text-base font-black text-slate-800">{stats.total} Orders</span>
          </div>
        </div>

        {/* Active Queue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100">
            <Clock className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Active Queue</span>
            <span className="text-base font-black text-slate-800">{stats.active} Cooking</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Completed</span>
            <span className="text-base font-black text-slate-800">{stats.completed} Served</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100">
            <XCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Cancelled</span>
            <span className="text-base font-black text-slate-800">{stats.cancelled} Voided</span>
          </div>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" />
              Transactions & Staff Assignments Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Explore historic receipts, manage active orders, and reassign Waiters/Riders</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by order or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition duration-150"
            />
          </div>
        </div>

        {/* Segmented Filter Sub Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 self-start shadow-inner max-w-max">
          {(['all', 'active', 'completed', 'cancelled'] as const).map(tab => (
            <button
              key={`subtab-${tab}`}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                activeSubTab === tab
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab} Records
            </button>
          ))}
        </div>

        {/* Grid Card List */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <span>No orders found matching the filter criteria.</span>
            </div>
          ) : (
            filteredOrders.map(order => {
              const staffDisplay = getStaffDisplay(order);
              const initials = staffDisplay.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div 
                  key={`ord-box-${order.id}`} 
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Card Header (Order No, Status) */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-slate-800">{order.order_number}</span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Order Details Body */}
                    <div className="space-y-2.5 text-xs">
                      
                      {/* Order Type with Rounded Icon backdrop */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Order Type</span>
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            {getOrderTypeIcon(order.order_type)}
                          </div>
                          {order.order_type} {order.table_number ? `(Table #${order.table_number})` : ''}
                        </span>
                      </div>

                      {/* Payment Status badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Payment Status</span>
                        <span className={`font-black rounded-lg px-2.5 py-0.5 text-[9px] uppercase tracking-wider border ${
                          order.payment_status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>{order.payment_status}</span>
                      </div>

                      {/* Staff Assignment Section redesigned as profile chip */}
                      <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-2.5 border border-slate-100 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black border border-orange-200">
                            {initials || 'U'}
                          </div>
                          <div className="leading-none">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">{staffDisplay.label}</span>
                            <span className="font-bold text-slate-800 text-xs block mt-0.5">{staffDisplay.name}</span>
                          </div>
                        </div>

                        {order.order_type !== 'Takeaway' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReassignOrder(order);
                              setReassignMethod(order.assignment_method || 'MANUAL');
                              setSelectedStaffId(order.waiter_id || order.delivery_rider_id || undefined);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/20 transition cursor-pointer"
                          >
                            <RotateCw className="h-3 w-3" /> Reassign
                          </button>
                        )}
                      </div>

                      {/* Customer Note */}
                      {order.customer_notes && (
                        <div className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-500 italic mt-2 border border-slate-100/50">
                          Note: {order.customer_notes}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card Footer (Price & CTA Buttons) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Grand Total</p>
                      <p className="font-mono text-base font-black text-slate-800 mt-0.5">{formatPKR(order.total_amount)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      
                      {/* View Details */}
                      <button
                        onClick={() => onViewOrder(order)}
                        className="flex h-8 px-3 items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </button>

                      {/* Accept (Pending status) */}
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Preparing')}
                          className="flex h-8 px-3 items-center gap-1 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-xs shadow-orange-500/20 cursor-pointer"
                        >
                          Accept
                        </button>
                      )}

                      {/* Deliver (Ready status) */}
                      {order.status === 'Ready' && (
                        <button
                          onClick={() => completeOrder(order.id)}
                          className="flex h-8 px-3 items-center gap-1 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition shadow-xs shadow-emerald-500/20 cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}

                      {/* Collect Payment (Unpaid status) */}
                      {order.payment_status === 'Unpaid' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => triggerPayment(order.id)}
                          className="flex h-8 px-3 items-center gap-1 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition shadow-xs shadow-teal-500/20 cursor-pointer"
                        >
                          Collect
                        </button>
                      )}

                      {/* Cancel Order */}
                      {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition cursor-pointer"
                          title="Cancel Order"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Staff Reassignment Modal */}
      {reassignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-orange-500" />
                Reassign Staff for Order #{reassignOrder.order_number}
              </h3>
              <button 
                onClick={() => setReassignOrder(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                <p className="text-slate-500">Order Type: <strong className="text-slate-800">{reassignOrder.order_type}</strong></p>
                <p className="text-slate-500">Current Assigned Staff: <strong className="text-slate-800">{getStaffDisplay(reassignOrder).name}</strong></p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Assignment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setReassignMethod('AUTO'); setSelectedStaffId(undefined); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reassignMethod === 'AUTO' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ⚡ Auto Assign (Round Robin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignMethod('MANUAL');
                      if (modalStaffList.length > 0 && !selectedStaffId) setSelectedStaffId(modalStaffList[0].id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reassignMethod === 'MANUAL' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    👤 Manual Select
                  </button>
                </div>
              </div>

              {reassignMethod === 'MANUAL' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Select {reassignOrder.order_type === 'Dine-In' ? 'Waiter' : 'Delivery Rider'}
                  </label>
                  <select
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">-- Choose {reassignOrder.order_type === 'Dine-In' ? 'Waiter' : 'Delivery Rider'} --</option>
                    {modalStaffList.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReassignOrder(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReassignment}
                disabled={isSubmitting}
                className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
