/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Flame, 
  GlassWater, 
  BookOpen, 
  Layers, 
  Users, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { motion } from 'motion/react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category: 'core' | 'operation' | 'master' | 'other';
  /** Which roles can see this item. Empty = everyone can see */
  allowedRoles?: string[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRoles = currentUser?.roles?.map(r => r.toUpperCase()) || [];

  // Check if user has full access (ADMIN, MANAGER, or CASHIER)
  const hasFullAccess = userRoles.some(r => ['ADMIN', 'MANAGER', 'CASHIER'].includes(r));

  const allSidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'core' },
    { id: 'pos', label: 'POS / Cashier', icon: ShoppingCart, category: 'operation' },
    { id: 'orders', label: 'Orders List', icon: Receipt, category: 'operation' },
    { id: 'kitchen', label: 'Kitchen Console', icon: Flame, category: 'operation', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'CHEF'] },
    { id: 'bar', label: 'Bar Console', icon: GlassWater, category: 'operation', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'BAR', 'BARTENDER'] },
    { id: 'menu', label: 'Menu List', icon: BookOpen, category: 'master' },
    { id: 'categories', label: 'Categories', icon: Layers, category: 'master' },
    { id: 'users', label: 'Staff Management', icon: Users, category: 'master' },
    { id: 'reports', label: 'Reports', icon: BarChart3, category: 'other' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'other' },
  ];

  // Filter sidebar items based on user roles
  const sidebarItems = allSidebarItems.filter(item => {
    // If user has full access, show everything
    if (hasFullAccess) return true;
    
    // If item has no role restriction, only show to full-access users
    if (!item.allowedRoles) return false;
    
    // Check if user has any of the allowed roles
    return item.allowedRoles.some(role => userRoles.includes(role));
  });

  const categories = [
    { id: 'core', label: 'Core' },
    { id: 'operation', label: 'Operations' },
    { id: 'master', label: 'Master Data' },
    { id: 'other', label: 'Analytics & Config' }
  ];

  return (
    <aside 
      id="sidebar-navigation"
      className={`relative flex h-[calc(100vh-4rem)] flex-col border-r border-slate-200 bg-white transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {categories.map((cat) => {
          const items = sidebarItems.filter(item => item.category === cat.id);
          if (items.length === 0) return null;

          return (
            <div key={`side-cat-${cat.id}`} className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {cat.label}
                </span>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={`side-item-${item.id}`}
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={`group relative flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
                      }`}
                      style={{
                        boxShadow: isActive ? '0 4px 12px rgba(249,115,22,0.25)' : undefined
                      }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-white" />
                      )}

                      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                      }`} />
                      
                      {!isCollapsed && (
                        <span className="truncate transition-colors duration-200">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        id="btn-sidebar-collapse"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 hidden h-6.5 w-6.5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-md sm:flex cursor-pointer transition-transform duration-200 active:scale-95"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
};
