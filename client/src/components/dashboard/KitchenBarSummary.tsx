/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDashboardStats } from '../../services/dashboardService';
import { Flame, GlassWater, Clock, User, CheckCircle2, ArrowRight } from 'lucide-react';

export const KitchenBarSummary: React.FC = () => {
  const { data: statsData, isLoading } = useDashboardStats();

  const kitchenPending = statsData?.todayStats?.kitchenPending || 0;
  const barPending = statsData?.todayStats?.barPending || 0;

  if (isLoading) {
    return <div className="text-slate-500 py-4 text-center text-sm animate-pulse">Loading Live Summaries...</div>;
  }

  return (
    <div id="kitchen-bar-summaries" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Kitchen Summary Panel */}
      <div id="kitchen-summary-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[400px]">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Flame className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-800">Kitchen Summary</h4>
              <p className="text-[10px] text-slate-400">Food preparation dispatch metrics</p>
            </div>
          </div>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-600 border border-orange-100">
            {kitchenPending} active
          </span>
        </div>

        {/* Counts indicators */}
        <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/45 rounded-xl px-2.5 mt-3 border border-slate-100/50">
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
            <p className="font-display text-sm font-bold text-blue-600">{kitchenPending}</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Preparing</p>
            <p className="font-display text-sm font-bold text-orange-500">-</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ready</p>
            <p className="font-display text-sm font-bold text-emerald-600">-</p>
          </div>
        </div>

        {/* Scrollable list of items */}
        <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-xs text-slate-400">Kitchen Queue API will be integrated in Phase 15.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Summary metrics above are live from backend.</p>
          </div>
        </div>
      </div>

      {/* 2. Bar Summary Panel */}
      <div id="bar-summary-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[400px]">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <GlassWater className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-800">Bar Summary</h4>
              <p className="text-[10px] text-slate-400">Beverages & desserts dispatch metrics</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600 border border-blue-100">
            {barPending} active
          </span>
        </div>

        {/* Counts indicators */}
        <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/45 rounded-xl px-2.5 mt-3 border border-slate-100/50">
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
            <p className="font-display text-sm font-bold text-blue-600">{barPending}</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Preparing</p>
            <p className="font-display text-sm font-bold text-orange-500">-</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ready</p>
            <p className="font-display text-sm font-bold text-emerald-600">-</p>
          </div>
        </div>

        {/* Scrollable list of items */}
        <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-xs text-slate-400">Bar Queue API will be integrated in Phase 15.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Summary metrics above are live from backend.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

