import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reportsService';
import { formatPKR } from './StatisticsCards';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, AreaChart, Area
} from 'recharts';

export const ReportsView: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today'|'week'|'month'|'year'>('month');

  // Helper to compute actual dates based on range
  const getDates = () => {
    const end = new Date();
    const start = new Date();
    if (dateRange === 'today') start.setDate(start.getDate() - 1);
    if (dateRange === 'week') start.setDate(start.getDate() - 7);
    if (dateRange === 'month') start.setMonth(start.getMonth() - 1);
    if (dateRange === 'year') start.setFullYear(start.getFullYear() - 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const dates = getDates();

  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales', 'summary', dateRange],
    queryFn: () => reportsService.getSalesSummary(dates.startDate, dates.endDate)
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => reportsService.getInventoryValuation()
  });

  const { data: staffPerformance } = useQuery({
    queryKey: ['reports', 'staffPerformance', dateRange],
    queryFn: () => reportsService.getStaffPerformance(dates.startDate, dates.endDate)
  });

  const isLoading = salesLoading || inventoryLoading;

  if (isLoading) {
    return <div className="p-8 flex justify-center items-center h-full">Loading Reports...</div>;
  }

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

  // Format daily sales for LineChart
  const formattedTrend = (salesSummary?.trend || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(),
    revenue: d.revenue
  }));

  // Format top items for BarChart
  const formattedTopItems = (salesSummary?.topItems || []).map((t: any) => ({
    name: t.name,
    quantity: t.quantity
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 animate-in fade-in duration-200"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            Analytics & Commercial Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">Accrual financial summaries, staff order logs, and warehouse valuation</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 self-start sm:self-auto shadow-inner">
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                dateRange === range 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-200">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{formatPKR(salesSummary?.totalRevenue || 0)}</h3>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-200">
          <div className="w-11 h-11 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Basket Value</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{formatPKR(salesSummary?.averageOrderValue || 0)}</h3>
          </div>
        </div>

        {/* Total Orders count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-200">
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{salesSummary?.totalOrders || 0} Orders</h3>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-200">
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Asset Value</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{formatPKR(inventoryData?.totalValue || 0)}</h3>
          </div>
        </div>

      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Trend (Daily)</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Accrued daily sales overview</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rs.${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip 
                  formatter={(value: number) => [formatPKR(value), 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#reportRevenueGradient)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Selling Products</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Top-selling menu items by quantity</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedTopItems} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={16}>
                  {
                    formattedTopItems.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid of Tables: Waiter Stats, Rider Stats, Stock Asset Valuation */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Operational Logs & Inventories</h2>
          <p className="text-xs text-slate-400">Track labor performance logs alongside current ingredient stock valuation</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* Waiter Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🍽️</span> Waiters Performance
              </h3>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                {staffPerformance?.waiters?.length || 0} active
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-2">Waiter</th>
                    <th className="pb-2 text-center">Orders</th>
                    <th className="pb-2 text-center">Tables</th>
                    <th className="pb-2 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {(!staffPerformance?.waiters || staffPerformance.waiters.length === 0) ? (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400 italic">No waiters recorded</td></tr>
                  ) : (
                    staffPerformance.waiters.map((w: any) => (
                      <tr key={`waiter-row-${w.id}`} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">{w.name}</td>
                        <td className="py-2.5 text-center font-mono">{w.ordersServed}</td>
                        <td className="py-2.5 text-center font-mono">{w.tablesManaged}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600 font-extrabold">{formatPKR(w.revenueServed)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Rider Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛵</span> Delivery Riders
              </h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {staffPerformance?.riders?.length || 0} active
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-2">Rider</th>
                    <th className="pb-2 text-center">Rides</th>
                    <th className="pb-2 text-center">Avg Time</th>
                    <th className="pb-2 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {(!staffPerformance?.riders || staffPerformance.riders.length === 0) ? (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400 italic">No riders recorded</td></tr>
                  ) : (
                    staffPerformance.riders.map((r: any) => (
                      <tr key={`rider-row-${r.id}`} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2.5 text-center font-mono">{r.deliveriesCompleted}</td>
                        <td className="py-2.5 text-center font-mono text-amber-600">{r.avgDeliveryTimeMinutes}m</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600 font-extrabold">{formatPKR(r.revenueDelivered)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Valuation Listing (Top 10 assets) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span> Inventory Valuation
              </h3>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Asset Stock
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-2">Ingredient</th>
                    <th className="pb-2 text-center">Stock Level</th>
                    <th className="pb-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {(!inventoryData?.items || inventoryData.items.length === 0) ? (
                    <tr><td colSpan={3} className="py-4 text-center text-slate-400 italic">No ingredients logged</td></tr>
                  ) : (
                    inventoryData.items.map((item: any, idx: number) => (
                      <tr key={`valuation-row-${idx}`} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">{item.name}</td>
                        <td className="py-2.5 text-center font-mono">{item.stock.toFixed(0)} units</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600 font-extrabold">{formatPKR(item.value)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
};
