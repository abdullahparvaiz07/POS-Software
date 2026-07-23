/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDashboardStats } from '../../services/dashboardService';
import { orderService } from '../../services/orderService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus, OrderType } from '../../types';
import { formatPKR } from './StatisticsCards';
import { 
  Receipt, 
  Search, 
  Eye, 
  Clock, 
  Coffee, 
  Package, 
  Bike, 
  MoreHorizontal,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface RecentOrdersProps {
  onViewOrder: (order: Order) => void;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ onViewOrder }) => {
  const { data: statsData, isLoading } = useDashboardStats();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (id: number) => orderService.cancelOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
  });

  const paymentMutation = useMutation({
    mutationFn: (id: number) => orderService.triggerPayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => orderService.completeOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
  });

  const cancelOrder = (id: number) => cancelMutation.mutate(id);
  const triggerPayment = (id: number) => paymentMutation.mutate(id);
  const completeOrder = (id: number) => completeMutation.mutate(id);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Format creation time to friendly view
  const formatOrderTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return 'N/A';
    }
  };

  // Find staff name
  const getStaffName = (staffObj: any) => {
    if (!staffObj) return 'Unassigned';
    return staffObj.fullName || 'Unassigned';
  };

  const rawOrders = statsData?.recentOrders || [];

  // Filter orders
  const filteredOrders = rawOrders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getStaffName(o.assignedStaff).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' ? true : o.orderType === typeFilter;
    const matchesStatus = statusFilter === 'All' ? true : o.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginated orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 ring-1 ring-blue-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Pending
          </span>
        );
      case 'Preparing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600 ring-1 ring-orange-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Preparing
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
            Ready
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'Dine-In':
        return <Coffee className="h-4 w-4 text-sky-500" />;
      case 'Takeaway':
        return <Package className="h-4 w-4 text-amber-500" />;
      case 'Delivery':
        return <Bike className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div id="recent-orders-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            Recent Orders
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Track, complete, or cancel daily orders</p>
        </div>

        {/* Action Controls: Search + Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              id="recent-orders-search"
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Type Filter */}
          <select
            id="recent-orders-filter-type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 outline-none hover:bg-slate-100"
          >
            <option value="All">All Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery</option>
          </select>

          {/* Status Filter */}
          <select
            id="recent-orders-filter-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 outline-none hover:bg-slate-100"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto">
        <table id="recent-orders-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-4 px-3">Order Number</th>
              <th className="py-4 px-3">Type</th>
              <th className="py-4 px-3">Assigned Staff</th>
              <th className="py-4 px-3">Status</th>
              <th className="py-4 px-3">Payment</th>
              <th className="py-4 px-3">Amount</th>
              <th className="py-4 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading recent orders...
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No orders found. Create new orders from the POS / Cashier tab.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order: any) => (
                <tr key={`row-order-${order.id}`} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">
                    {order.orderNumber}
                    {order.tableNumber && (
                      <span className="ml-1.5 rounded bg-sky-50 px-1 py-0.5 font-sans text-[10px] font-semibold text-sky-600">
                        Table {order.tableNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      {getOrderTypeIcon(order.orderType)}
                      {order.orderType}
                      {order.takeawayMode && (
                        <span className="text-[10px] text-slate-400">({order.takeawayMode})</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{getStaffName(order.assignedStaff)}</span>
                      {order.assignedRole && (
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{order.assignedRole}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {formatPKR(order.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View details / receipt button */}
                      <button
                        onClick={() => onViewOrder(order)}
                        title="View Detailed Receipt"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/35 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Cancel order quickly */}
                      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          title="Cancel Order"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/35 transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Pay order quickly */}
                      {(order.paymentStatus === 'UNPAID' || order.paymentStatus === 'Unpaid') && order.status !== 'CANCELLED' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => triggerPayment(order.id)}
                          title="Collect Payment"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/35 transition-all animate-pulse"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="mt-4.5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[11px] font-medium text-slate-400">
          Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} transactions
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-bold text-slate-600 px-3">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
