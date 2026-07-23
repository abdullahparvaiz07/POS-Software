/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Coffee, 
  Package, 
  Bike, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  CreditCard, 
  Flame, 
  GlassWater 
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useDashboardStats } from '../../services/dashboardService';

export const formatPKR = (amount: number | undefined | null, currencySymbol: string = 'PKR') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol} 0`;
  }
  return `${currencySymbol} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

interface CardProps {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  colorTheme: 'orange' | 'emerald' | 'amber' | 'blue' | 'red' | 'purple' | 'slate';
  description?: string;
  onClick?: () => void;
}

export const StatisticsCards: React.FC = () => {
  const { setActiveTab, stats: ctxStats } = useDashboard();
  const { data: statsData } = useDashboardStats();

  const revenue = statsData?.todayStats?.revenue ?? ctxStats.todayRevenue ?? 0;
  const cashSales = statsData?.todayStats?.cashSales ?? ctxStats.cashInHand ?? 0;
  const ordersCount = statsData?.todayStats?.ordersCount ?? ctxStats.totalOrders ?? 0;
  const dineInCount = statsData?.charts?.orderTypeBreakdown?.find(o => o.type === 'DINE_IN' || o.type === 'Dine-In')?.count ?? ctxStats.dineInOrders ?? 0;
  const takeawayCount = statsData?.charts?.orderTypeBreakdown?.find(o => o.type === 'TAKEAWAY' || o.type === 'Takeaway')?.count ?? ctxStats.takeawayOrders ?? 0;
  const deliveryCount = statsData?.charts?.orderTypeBreakdown?.find(o => o.type === 'DELIVERY' || o.type === 'Delivery')?.count ?? ctxStats.deliveryOrders ?? 0;
  const cancelledOrders = statsData?.todayStats?.cancelledOrders ?? ctxStats.cancelledOrders ?? 0;
  const cancelledRevenue = statsData?.todayStats?.cancelledRevenue ?? ctxStats.cancelledRevenue ?? 0;
  const creditOrders = statsData?.todayStats?.creditOrders ?? ctxStats.creditOrders ?? 0;
  const creditedAmount = statsData?.todayStats?.creditedAmount ?? ctxStats.creditedAmount ?? 0;
  const kitchenPending = statsData?.todayStats?.kitchenPending ?? ctxStats.kitchenQueueCount ?? 0;
  const barPending = statsData?.todayStats?.barPending ?? ctxStats.barQueueCount ?? 0;

  const cards: CardProps[] = [
    {
      id: 'today-revenue',
      title: "Today's Revenue",
      value: formatPKR(revenue),
      icon: TrendingUp,
      colorTheme: 'emerald',
      description: 'Total completed paid sales today',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'cash-in-hand',
      title: 'Cash In Hand',
      value: formatPKR(cashSales),
      icon: Wallet,
      colorTheme: 'emerald',
      description: 'Cash received by cashier counter',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: ordersCount,
      icon: ShoppingBag,
      colorTheme: 'orange',
      description: 'Total orders logged today',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'dine-in-orders',
      title: 'Dine-In Orders',
      value: dineInCount,
      icon: Coffee,
      colorTheme: 'orange',
      description: 'Active/completed table orders',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'takeaway-orders',
      title: 'Takeaway Orders',
      value: takeawayCount,
      icon: Package,
      colorTheme: 'orange',
      description: 'Counter & Car pickup orders',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'delivery-orders',
      title: 'Delivery Orders',
      value: deliveryCount,
      icon: Bike,
      colorTheme: 'orange',
      description: 'Rider dispatched deliveries',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'cancelled-orders',
      title: 'Cancelled Orders',
      value: cancelledOrders,
      icon: XCircle,
      colorTheme: 'red',
      description: 'Orders cancelled today',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'cancelled-revenue',
      title: 'Cancelled Revenue',
      value: formatPKR(cancelledRevenue),
      icon: AlertTriangle,
      colorTheme: 'red',
      description: 'Value of cancelled transactions',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'credit-orders',
      title: 'Credit Orders',
      value: creditOrders,
      icon: FileText,
      colorTheme: 'amber',
      description: 'Unpaid completed transactions',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'credited-amount',
      title: 'Credited Amount',
      value: formatPKR(creditedAmount),
      icon: CreditCard,
      colorTheme: 'amber',
      description: 'Total outstanding credit book',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'kitchen-queue',
      title: 'Kitchen Queue',
      value: kitchenPending,
      icon: Flame,
      colorTheme: 'purple',
      description: 'Pending food prep orders',
      onClick: () => setActiveTab('kitchen')
    },
    {
      id: 'bar-queue',
      title: 'Bar Queue',
      value: barPending,
      icon: GlassWater,
      colorTheme: 'blue',
      description: 'Pending drink prep orders',
      onClick: () => setActiveTab('bar')
    }
  ];

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/80',
          iconContainer: 'bg-emerald-500 text-white shadow-emerald-100',
          border: 'border-emerald-100',
          text: 'text-emerald-700',
          lightText: 'text-emerald-500'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 hover:bg-orange-100/80',
          iconContainer: 'bg-orange-500 text-white shadow-orange-100',
          border: 'border-orange-100',
          text: 'text-orange-700',
          lightText: 'text-orange-500'
        };
      case 'red':
        return {
          bg: 'bg-red-50 hover:bg-red-100/80',
          iconContainer: 'bg-red-500 text-white shadow-red-100',
          border: 'border-red-100',
          text: 'text-red-700',
          lightText: 'text-red-500'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100/80',
          iconContainer: 'bg-amber-500 text-white shadow-amber-100',
          border: 'border-amber-100',
          text: 'text-amber-700',
          lightText: 'text-amber-500'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100/80',
          iconContainer: 'bg-purple-500 text-white shadow-purple-100',
          border: 'border-purple-100',
          text: 'text-purple-700',
          lightText: 'text-purple-500'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100/80',
          iconContainer: 'bg-blue-500 text-white shadow-blue-100',
          border: 'border-blue-100',
          text: 'text-blue-700',
          lightText: 'text-blue-500'
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100/80',
          iconContainer: 'bg-slate-500 text-white shadow-slate-100',
          border: 'border-slate-100',
          text: 'text-slate-700',
          lightText: 'text-slate-400'
        };
    }
  };

  return (
    <div id="statistics-cards-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {cards.map((card) => {
        const theme = getThemeClasses(card.colorTheme);
        const Icon = card.icon;

        return (
          <div
            key={`stat-card-${card.id}`}
            id={`stat-card-${card.id}`}
            onClick={card.onClick}
            className={`group flex flex-col justify-between rounded-2xl border ${theme.border} bg-white p-4.5 shadow-sm transition-all duration-200 ease-out cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-slate-300`}
          >
            {/* Header: Title + Icon */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xs font-semibold tracking-wide text-slate-500 group-hover:text-slate-800 transition-colors duration-200">
                {card.title}
              </span>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md transition-all duration-200 group-hover:brightness-105 group-hover:scale-105 ${theme.iconContainer}`}>
                <Icon className="h-5 w-5 transition-transform duration-200 ease-out group-hover:rotate-[5deg]" />
              </div>
            </div>

            {/* Content: Value + Info */}
            <div className="mt-4">
              <h4 className="font-display text-lg font-bold tracking-tight text-slate-800 xl:text-xl transition-transform duration-200 ease-out group-hover:scale-[1.03] origin-left">
                {card.value}
              </h4>
              {card.description && (
                <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400 group-hover:text-slate-500 transition-colors duration-200 line-clamp-1">
                  {card.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
