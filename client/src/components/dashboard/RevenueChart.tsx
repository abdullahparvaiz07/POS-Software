/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useDashboardStats } from '../../services/dashboardService';
import { formatPKR } from './StatisticsCards';
import { TrendingUp, BarChart2, ShoppingCart } from 'lucide-react';

import { useDashboard } from '../../context/DashboardContext';

export const RevenueChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly'>('weekly');
  const { orders } = useDashboard();
  const { data: statsData } = useDashboardStats();

  // Select dataset based on state
  const getData = () => {
    if (statsData?.charts?.salesTrend?.length) {
      return statsData.charts.salesTrend.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        Revenue: Number(d.revenue) || 0,
        Orders: Number(d.orders) || 0
      }));
    }

    // Fallback: Calculate 7-day revenue trend dynamically from orders context
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: days[d.getDay()],
        Revenue: 0,
        Orders: 0
      };
    });

    orders.forEach(o => {
      if (o.created_at) {
        const orderDateStr = new Date(o.created_at).toISOString().split('T')[0];
        const dayMatch = last7Days.find(d => d.dateStr === orderDateStr);
        if (dayMatch) {
          dayMatch.Orders += 1;
          if (o.status === 'Completed' && o.payment_status === 'Paid') {
            dayMatch.Revenue += o.total_amount;
          }
        }
      }
    });

    return last7Days.map(d => ({ name: d.dayName, Revenue: d.Revenue, Orders: d.Orders }));
  };

  const currentData = getData();

  // Calculate high-level aggregates for the chart panel header
  const totalRevenue = currentData.reduce((sum, item) => sum + item.Revenue, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.Orders, 0);

  // Custom Tooltip component for beautiful high-contrast styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl ring-1 ring-black/5">
          <p className="font-display text-xs font-bold text-slate-800">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((pld: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center gap-4 justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pld.color }} />
                  {pld.name}:
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {pld.name === 'Revenue' ? formatPKR(pld.value) : pld.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="revenue-chart-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header with selector and aggregates */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-orange-500" />
            Revenue Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time revenue stream vs order volume</p>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 self-start">
          <button
            id="tab-chart-today"
            onClick={() => setTimeframe('today')}
            className={`rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-all ${
              timeframe === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today
          </button>
          <button
            id="tab-chart-weekly"
            onClick={() => setTimeframe('weekly')}
            className={`rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-all ${
              timeframe === 'weekly' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Weekly
          </button>
          <button
            id="tab-chart-monthly"
            onClick={() => setTimeframe('monthly')}
            className={`rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-all ${
              timeframe === 'monthly' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Sub-header showing aggregates */}
      <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-4">
        <div className="border-r border-slate-100 pr-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timeframe Sales</p>
          <p className="font-display mt-0.5 text-base font-extrabold text-slate-800">{formatPKR(totalRevenue)}</p>
        </div>
        <div className="border-r border-slate-100 pr-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timeframe Orders</p>
          <p className="font-display mt-0.5 text-base font-extrabold text-slate-800">{totalOrders} Orders</p>
        </div>
        <div className="border-r border-slate-100 pr-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Basket Value</p>
          <p className="font-display mt-0.5 text-base font-extrabold text-slate-800">
            {formatPKR(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active Sync
          </p>
        </div>
      </div>

      {/* Recharts Chart View */}
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => `Rs.${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontWeight: 500, color: '#475569' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="Revenue" 
              stroke="#f97316" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#revenueGradient)" 
              name="Revenue"
            />
            <Bar 
              yAxisId="right"
              dataKey="Orders" 
              fill="#cbd5e1" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={12}
              name="Orders"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
