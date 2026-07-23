/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Flame, 
  Clock, 
  User, 
  Check, 
  Play, 
  CheckCircle,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { QueueItemStatus, QueueItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

// Live timer component
const LiveTimer: React.FC<{ createdAt: string; estimatedMins?: number }> = ({ createdAt, estimatedMins = 15 }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const update = () => {
      const now = new Date().getTime();
      const diffMins = Math.floor((now - start) / 60000);
      setElapsed(diffMins);
    };
    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [createdAt]);

  const isDelayed = elapsed > estimatedMins;

  return (
    <div className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded ${
      isDelayed ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'
    }`}>
      <Clock className="h-3 w-3" />
      {elapsed} min {isDelayed && <AlertTriangle className="h-3 w-3 ml-1" />}
    </div>
  );
};

export const KitchenView: React.FC = () => {
  const { queueItems, orders, users: staff, updateQueueItemStatus, menuItems, categories } = useDashboard();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStation, setFilterStation] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  // 1. Compile all kitchen items
  const allKitchenItemsMap = new Map<string, any>();
  
  const normalizeStatus = (s: string) => {
    if (!s) return 'Pending';
    const upper = s.toUpperCase();
    if (upper === 'PENDING') return 'Pending';
    if (upper === 'PREPARING' || upper === 'COOKING') return 'Preparing';
    if (upper === 'READY') return 'Ready';
    if (upper === 'COMPLETED' || upper === 'SERVED') return 'Completed';
    return s;
  };

  // Compile queue items first (since they have the active prep states)
  queueItems.forEach(qi => {
    const prepArea = (qi.preparation_area || '').toUpperCase();
    if (prepArea === 'KITCHEN' || prepArea === '' || qi.assigned_staff_id === 105) {
      const order = orders.find(o => o.id === qi.order_id);
      allKitchenItemsMap.set(`queue-item-${qi.id}`, {
        ...qi,
        status: normalizeStatus(qi.status),
        order_type: order?.order_type || 'Takeaway',
        table_number: order?.table_number,
        waiter_name: order?.waiter_name || getStaffName(order?.assigned_staff_id || null),
        created_at: qi.created_at || order?.created_at || new Date().toISOString()
      });
    }
  });

  // Compile order items (excluding those that are already in queueItems to avoid duplicates)
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const prepArea = (item.preparation_area || '').toUpperCase();
      if (prepArea === 'KITCHEN' || prepArea === 'FOOD' || prepArea === '' || !prepArea) {
        // If a queue item already exists for this order item, do not add the raw order item
        const hasQueueItem = queueItems.some(qi => qi.order_item_id === item.id);
        if (!hasQueueItem) {
          allKitchenItemsMap.set(`order-item-${item.id}`, {
            id: item.id,
            order_number: order.order_number,
            menu_item_name: item.menu_item_name,
            quantity: item.quantity,
            preparation_area: 'Kitchen' as const,
            status: normalizeStatus((item as any).status || (order.status === 'Completed' ? 'Completed' : 'Pending')),
            assigned_staff_id: (order as any).assigned_staff_id || null,
            created_at: order.created_at,
            notes: item.notes,
            order_type: order.order_type,
            table_number: order.table_number,
            waiter_name: order.waiter_name || getStaffName(order.assigned_staff_id)
          });
        }
      }
    });
  });

  function getStaffName(staffId: number | null) {
    if (!staffId) return 'Unassigned';
    const s = staff.find(member => member.id === staffId);
    return s ? s.full_name : 'Unassigned';
  }

  const rawItems = Array.from(allKitchenItemsMap.values());

  // Quick Metrics
  const pendingCount = rawItems.filter(i => i.status === 'Pending').length;
  const cookingCount = rawItems.filter(i => i.status === 'Preparing').length;
  const readyCount = rawItems.filter(i => i.status === 'Ready').length;

  // Filter Items
  const filteredItems = rawItems.filter(item => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        item.order_number?.toLowerCase().includes(search) || 
        item.waiter_name?.toLowerCase().includes(search) ||
        item.menu_item_name?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filterType !== 'All' && item.order_type !== filterType) return false;
    
    if (filterStation !== 'All') {
      const menuItem = menuItems.find(m => m.name === item.menu_item_name);
      if (!menuItem || menuItem.category_id !== Number(filterStation)) {
        return false;
      }
    }
    return true;
  });

  // Get active kitchen categories for station filtering (dynamic)
  const kitchenCategories = categories.filter(c => 
    menuItems.some(m => m.category_id === c.id && m.preparation_area === 'Kitchen')
  );

  const columns = [
    { id: 'Pending', label: 'Pending', status: 'Pending', color: 'bg-slate-50', headerColor: 'text-slate-600', borderColor: 'border-slate-200' },
    { id: 'Preparing', label: 'Cooking', status: 'Preparing', color: 'bg-orange-50/30', headerColor: 'text-orange-600', borderColor: 'border-orange-200' },
    { id: 'Ready', label: 'Ready', status: 'Ready', color: 'bg-emerald-50/30', headerColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
    { id: 'Completed', label: 'Completed', status: 'Completed', color: 'bg-slate-50', headerColor: 'text-slate-400', borderColor: 'border-slate-100' }
  ];

  // Helper to extract special notes into badges
  const renderNotes = (notes: string) => {
    if (!notes) return null;
    const badges = notes.split(',').map(n => n.trim().toUpperCase());
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {badges.map((b, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black tracking-wider">
            {b}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Bar Dashboard */}
      <div className="flex-none rounded-xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900 leading-tight">KDS Dashboard</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time Kitchen Display System</p>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-700 leading-none">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-orange-600 leading-none">{cookingCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Cooking</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-600 leading-none">{readyCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ready</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <select 
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="h-10 rounded-lg bg-slate-50 border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="All">All Stations</option>
            {kitchenCategories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-lg bg-slate-50 border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search order..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-48 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colItems = filteredItems.filter(i => i.status === col.status);
          
          return (
            <div key={col.id} className={`flex-1 min-w-[300px] flex flex-col rounded-xl border ${col.borderColor} bg-white overflow-hidden shadow-sm`}>
              {/* Column Header */}
              <div className={`p-4 border-b ${col.borderColor} ${col.color} flex items-center justify-between`}>
                <h3 className={`font-display text-sm font-black uppercase tracking-wider ${col.headerColor}`}>
                  {col.label}
                </h3>
                <span className={`px-2 py-0.5 rounded text-xs font-bold bg-white shadow-sm ${col.headerColor}`}>
                  {colItems.length}
                </span>
              </div>
              
              {/* Column Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                <AnimatePresence mode="popLayout">
                  {colItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={`kds-${item.id}`}
                      className={`relative bg-white rounded-xl p-4 shadow-sm border ${
                        item.status === 'Preparing' ? 'border-orange-200 shadow-orange-100' :
                        item.status === 'Ready' ? 'border-emerald-200 shadow-emerald-100' :
                        'border-slate-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            Order
                          </div>
                          <div className="font-mono text-lg font-black text-slate-900 leading-none mt-0.5">
                            {item.order_number}
                          </div>
                        </div>
                        <LiveTimer createdAt={item.created_at} estimatedMins={15} />
                      </div>

                      {/* Card Meta */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {item.order_type}
                        </span>
                        {item.table_number && (
                          <span className="px-2 py-1 rounded bg-blue-50 text-[10px] font-bold text-blue-700 uppercase">
                            Table {item.table_number}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded flex items-center gap-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                          <User className="h-3 w-3" /> {item.waiter_name}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="py-3 border-t border-b border-slate-100">
                        <div className="font-display text-base font-black text-slate-900">
                          <span className="text-orange-500 mr-1">{item.quantity}x</span>
                          {item.menu_item_name}
                        </div>
                        {renderNotes(item.notes)}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {item.status === 'Pending' && (
                          <button
                            onClick={() => updateQueueItemStatus(item.id, 'Preparing')}
                            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Play className="h-4 w-4 fill-white" /> Start Cooking
                          </button>
                        )}
                        {item.status === 'Preparing' && (
                          <button
                            onClick={() => updateQueueItemStatus(item.id, 'Ready')}
                            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="h-4 w-4 stroke-[3]" /> Mark Ready
                          </button>
                        )}
                        {item.status === 'Ready' && (
                          <button
                            onClick={() => updateQueueItemStatus(item.id, 'Completed')}
                            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-white border-2 border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <CheckCircle className="h-4 w-4" /> Picked Up
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {colItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-xl">
                      Empty
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
