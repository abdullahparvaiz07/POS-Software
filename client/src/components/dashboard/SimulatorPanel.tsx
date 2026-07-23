/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { OrderType, TakeawayMode, MenuItem } from '../../types';
import { 
  Plus, Play, RefreshCw, Zap, Coffee, Package, Bike, UserPlus, 
  Activity, ActivityIcon, PlusCircle, Monitor, ShieldCheck, 
  Wifi, WifiOff, Printer, Database, CheckCircle2, ChevronRight, BookOpen
} from 'lucide-react';
import { formatPKR } from './StatisticsCards';

export const SimulatorPanel: React.FC = () => {
  const { 
    users, 
    menuItems, 
    createMockOrder, 
    resetAllData, 
    orders, 
    updateOrderStatus, 
    queueItems, 
    updateQueueItemStatus,
    activities,
    addMenuItem,
    kitchenStatus, 
    barStatus, 
    printerStatus, 
    dbStatus, 
    internetStatus,
    toggleKitchenStatus,
    toggleBarStatus,
    togglePrinterStatus,
    toggleDbStatus,
    toggleInternetStatus,
    setActiveTab
  } = useDashboard();

  const [activeTab, setActiveTabLocal] = useState<'simulate' | 'operations' | 'activity'>('simulate');
  
  // Create Order simulator state
  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [takeawayMode, setTakeawayMode] = useState<TakeawayMode | null>(null);
  const [tableNumber, setTableNumber] = useState<number>(3);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(102); // Zainab Khan Waiter

  // Add Menu Item Quick Form state
  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState('Burgers');
  const [newMenuArea, setNewMenuArea] = useState<'Kitchen' | 'Bar'>('Kitchen');
  const [newMenuDesc, setNewMenuDesc] = useState('');

  // Get eligible staff for selected role
  const getEligibleStaff = () => {
    if (orderType === 'Dine-In' || (orderType === 'Takeaway' && takeawayMode === 'Car')) {
      return users.filter(s => s.capabilities.includes('Waiter'));
    }
    if (orderType === 'Delivery') {
      return users.filter(s => s.capabilities.includes('Rider'));
    }
    return [];
  };

  const eligibleStaff = getEligibleStaff();

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    const staffId = orderType === 'Takeaway' && takeawayMode === 'Counter' ? null : selectedStaffId;
    const tableNum = orderType === 'Dine-In' ? tableNumber : null;
    const mode = orderType === 'Takeaway' ? (takeawayMode || 'Counter') : null;

    createMockOrder(orderType, mode, tableNum, staffId);
  };

  // Quick Action Shortcuts
  const advanceAllPreparingToReady = () => {
    const preparingItems = queueItems.filter(qi => qi.status === 'Preparing');
    if (preparingItems.length === 0) {
      alert('No items are currently in "Preparing" status.');
      return;
    }
    preparingItems.forEach(qi => updateQueueItemStatus(qi.id, 'Ready'));
  };

  const completeAllReadyOrders = () => {
    const readyOrders = orders.filter(o => o.status === 'Ready');
    if (readyOrders.length === 0) {
      alert('No orders are currently in "Ready" status.');
      return;
    }
    readyOrders.forEach(o => updateOrderStatus(o.id, 'Completed'));
  };

  // Handle Add custom item
  const handleAddMenuItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) {
      alert('Please fill in Name and Price!');
      return;
    }

    const priceNum = Number(newMenuPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please provide a valid price!');
      return;
    }

    addMenuItem({
      name: newMenuName,
      price: priceNum,
      category: newMenuCategory,
      preparation_area: newMenuArea,
      description: newMenuDesc || 'Fresh custom chef special dish.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60',
      is_available: true
    });

    // Reset form
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuDesc('');
    setShowAddMenuForm(false);
  };

  return (
    <div id="simulator-terminal-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Tab Header Selector */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-[13px] font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <Zap className="h-4.5 w-4.5 text-orange-500 fill-orange-500 animate-pulse" />
            Operations Console
          </h4>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">Cashier Center</span>
        </div>

        {/* Triple Tab buttons */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTabLocal('simulate')}
            className={`rounded-lg py-1.5 text-[10px] font-extrabold tracking-wide transition-all ${
              activeTab === 'simulate' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulate
          </button>
          <button
            onClick={() => setActiveTabLocal('operations')}
            className={`rounded-lg py-1.5 text-[10px] font-extrabold tracking-wide transition-all ${
              activeTab === 'operations' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hub & Actions
          </button>
          <button
            onClick={() => setActiveTabLocal('activity')}
            className={`rounded-lg py-1.5 text-[10px] font-extrabold tracking-wide transition-all ${
              activeTab === 'activity' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Recent Activity
          </button>
        </div>
      </div>

      {/* TAB 1: Simulation Controls */}
      {activeTab === 'simulate' && (
        <div className="space-y-4 animate-in fade-in duration-100">
          <form onSubmit={handleCreateOrder} className="space-y-3">
            {/* Order Type Selection */}
            <div>
              <label className="font-display text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Order Fulfillment</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Dine-In');
                    setTakeawayMode(null);
                    setSelectedStaffId(102); // Waiter default
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                    orderType === 'Dine-In'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-bold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Coffee className="h-4 w-4" />
                  <span className="text-[10px]">Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Takeaway');
                    setTakeawayMode('Counter');
                    setSelectedStaffId(102); // Waiter default
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                    orderType === 'Takeaway'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-bold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span className="text-[10px]">Takeaway</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Delivery');
                    setTakeawayMode(null);
                    setSelectedStaffId(104); // Rider default
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                    orderType === 'Delivery'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-bold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Bike className="h-4 w-4" />
                  <span className="text-[10px]">Delivery</span>
                </button>
              </div>
            </div>

            {/* Conditional Sub-selectors */}
            {orderType === 'Dine-In' && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Table Number</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-xs text-slate-700 outline-none mt-1 focus:border-orange-500 focus:bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={`opt-table-${num}`} value={num}>Table {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Assign Waiter</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-xs text-slate-700 outline-none mt-1 focus:border-orange-500 focus:bg-white"
                  >
                    {eligibleStaff.map(member => (
                      <option key={`opt-staff-wait-${member.id}`} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {orderType === 'Takeaway' && (
              <div className="space-y-2 animate-in fade-in duration-100">
                <div className="flex gap-4 p-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="takeaway_mode"
                      checked={takeawayMode === 'Counter'}
                      onChange={() => setTakeawayMode('Counter')}
                      className="accent-orange-500"
                    />
                    Counter Pickup
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="takeaway_mode"
                      checked={takeawayMode === 'Car'}
                      onChange={() => {
                        setTakeawayMode('Car');
                        setSelectedStaffId(102); // Waiter default
                      }}
                      className="accent-orange-500"
                    />
                    Car Delivery
                  </label>
                </div>

                {takeawayMode === 'Car' && (
                  <div className="animate-in slide-in-from-top-1 duration-100">
                    <label className="text-[10px] font-bold text-slate-500">Assign Waiter (Car Delivery)</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-xs text-slate-700 outline-none mt-1 focus:border-orange-500 focus:bg-white"
                    >
                      {eligibleStaff.map(member => (
                        <option key={`opt-staff-car-${member.id}`} value={member.id}>{member.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {orderType === 'Delivery' && (
              <div className="animate-in fade-in duration-100">
                <label className="text-[10px] font-bold text-slate-500">Assign Delivery Rider</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-xs text-slate-700 outline-none mt-1 focus:border-orange-500 focus:bg-white"
                >
                  {eligibleStaff.map(member => (
                    <option key={`opt-staff-rider-${member.id}`} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 font-display text-xs font-bold text-white shadow-md shadow-orange-100 hover:bg-orange-600 transition-all cursor-pointer mt-2"
            >
              <Plus className="h-4 w-4" /> Simulate Fresh Customer Order
            </button>
          </form>

          <div className="border-t border-slate-100 pt-3.5 space-y-2">
            <h5 className="font-display text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Fast-Forward Events</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={advanceAllPreparingToReady}
                className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50/30 p-2 text-left hover:bg-orange-50 transition-all"
              >
                <Zap className="h-4 w-4 text-orange-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-orange-850 truncate">Ready Preps</p>
                  <p className="text-[8px] text-orange-600 truncate">Preparing → Ready</p>
                </div>
              </button>
              <button
                onClick={completeAllReadyOrders}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/30 p-2 text-left hover:bg-emerald-50 transition-all"
              >
                <Play className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-emerald-850 truncate">Deliver All</p>
                  <p className="text-[8px] text-emerald-600 truncate">Ready → Completed</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Operations Hub (Status & Quick Actions) */}
      {activeTab === 'operations' && (
        <div className="space-y-4 animate-in fade-in duration-100">
          {/* Quick Actions Shortcuts */}
          <div className="space-y-1.5">
            <h5 className="font-display text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Quick Actions</h5>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTab('pos')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/60 p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 text-left transition-all"
              >
                <PlusCircle className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-[10.5px] font-bold leading-tight">Create Order (POS)</span>
              </button>
              <button
                onClick={() => setActiveTab('kitchen')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/60 p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 text-left transition-all"
              >
                <Monitor className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-[10.5px] font-bold leading-tight">View Kitchen</span>
              </button>
              <button
                onClick={() => setActiveTab('bar')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/60 p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 text-left transition-all"
              >
                <Monitor className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="text-[10.5px] font-bold leading-tight">View Bar Console</span>
              </button>
              <button
                onClick={() => setShowAddMenuForm(!showAddMenuForm)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/60 p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 text-left transition-all"
              >
                <PlusCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-[10.5px] font-bold leading-tight">Add Menu Item</span>
              </button>
            </div>
          </div>

          {/* Quick Menu Item Registration Form */}
          {showAddMenuForm && (
            <form onSubmit={handleAddMenuItemSubmit} className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Quick Register Item
                </span>
                <button type="button" onClick={() => setShowAddMenuForm(false)} className="text-slate-400 hover:text-slate-600 text-[10px]">Close</button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <input
                    type="text"
                    placeholder="Item Name (e.g. Samosa)"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Price (PKR)"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none"
                  >
                    <option value="Burgers">Burgers</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Sides">Sides</option>
                    <option value="Sweets">Sweets</option>
                  </select>
                </div>
                <div>
                  <select
                    value={newMenuArea}
                    onChange={(e) => setNewMenuArea(e.target.value as 'Kitchen' | 'Bar')}
                    className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none"
                  >
                    <option value="Kitchen">Kitchen Prep</option>
                    <option value="Bar">Bar Prep</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded bg-emerald-600 text-white py-1 font-display text-[10px] font-bold hover:bg-emerald-700 transition-all cursor-pointer"
              >
                Register Custom Menu Item
              </button>
            </form>
          )}

          {/* System status display */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <h5 className="font-display text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Live Status Indicators</h5>
            <div className="grid grid-cols-2 gap-2">
              {/* Internet */}
              <div 
                onClick={toggleInternetStatus}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {internetStatus === 'Connected' ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold text-slate-600 truncate text-[10.5px]">Internet Link</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${internetStatus === 'Connected' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                  {internetStatus === 'Connected' ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Database */}
              <div 
                onClick={toggleDbStatus}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Database className={`h-4 w-4 ${dbStatus === 'Connected' ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className="font-semibold text-slate-600 truncate text-[10.5px]">PostgreSQL DB</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${dbStatus === 'Connected' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                  {dbStatus === 'Connected' ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Printer */}
              <div 
                onClick={togglePrinterStatus}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Printer className={`h-4 w-4 ${printerStatus === 'Connected' ? 'text-emerald-500' : (printerStatus === 'Error' ? 'text-amber-500' : 'text-red-500')}`} />
                  <span className="font-semibold text-slate-600 truncate text-[10.5px]">Thermal Print</span>
                </div>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${printerStatus === 'Connected' ? 'text-emerald-700 bg-emerald-50' : (printerStatus === 'Error' ? 'text-amber-700 bg-amber-50 animate-pulse' : 'text-red-700 bg-red-50')}`}>
                  {printerStatus === 'Connected' ? 'Active' : (printerStatus === 'Error' ? 'Jam' : 'Offline')}
                </span>
              </div>

              {/* Kitchen Monitor */}
              <div 
                onClick={toggleKitchenStatus}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Coffee className={`h-4 w-4 ${kitchenStatus === 'Online' ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className="font-semibold text-slate-600 truncate text-[10.5px]">Kitchen Disp</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${kitchenStatus === 'Online' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                  {kitchenStatus === 'Online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">
              💡 Click on any status card above to simulate device disconnects, server outages, or paper jams instantly!
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Recent Activity Logging Timeline */}
      {activeTab === 'activity' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <h5 className="font-display text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Activity Timeline</h5>
            <span className="rounded bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-400">Live Logging</span>
          </div>

          <div className="relative border-l border-slate-100 pl-3.5 space-y-3 max-h-[220px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 pl-2">
                <ActivityIcon className="mx-auto h-7 w-7 text-slate-200 mb-1.5" />
                No actions logged yet
              </div>
            ) : (
              activities.map((act) => {
                const isSystem = act.actor === 'System';
                const isCashier = act.actor.includes('Cashier');
                const isKitchen = act.actor === 'Kitchen' || act.actor === 'Bar';

                const dotColor = isSystem ? 'bg-indigo-500' : 
                                 isCashier ? 'bg-orange-500' : 
                                 isKitchen ? 'bg-emerald-500' : 'bg-slate-400';

                return (
                  <div key={act.id} className="relative group text-xs">
                    {/* timeline node dot */}
                    <span className={`absolute -left-[19.5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${dotColor}`} />
                    
                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-slate-700">{act.actor}</span>
                      <span className="font-mono text-[9px] text-slate-400">{act.time}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{act.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
