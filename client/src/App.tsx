/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { StatisticsCards } from './components/dashboard/StatisticsCards';
import { RevenueChart } from './components/dashboard/RevenueChart';
import { RecentOrders } from './components/dashboard/RecentOrders';
import { KitchenBarSummary } from './components/dashboard/KitchenBarSummary';
// SimulatorPanel removed — production mode
import { Modals } from './components/dashboard/Modals';

// Auth Components
import { LoginPage } from './pages/Login/LoginPage';
import { authService } from './services/authService';

// Core Sub-Views
import { POSView } from './components/dashboard/POSView';
import { OrdersView } from './components/dashboard/OrdersView';
import { KitchenView } from './components/dashboard/KitchenView';
import { BarView } from './components/dashboard/BarView';
import { UsersView } from './components/dashboard/UsersView';
import { SettingsView } from './components/dashboard/SettingsView';
import { ReportsView } from './components/dashboard/ReportsView';
import { MenuView } from './components/dashboard/MenuView';
import { CategoriesView } from './components/dashboard/CategoriesView';

// Types
import { Order } from './types';
import { formatPKR } from './components/dashboard/StatisticsCards';

// Fallback mockup screens for other unrequested modules to maintain a perfect complete look
import { BookOpen, Layers, BarChart3, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

const MainAppContent: React.FC = () => {
  const { 
    currentUser,
    activeTab, 
    menuItems, 
    categories, 
    internetStatus, 
    dbStatus, 
    printerStatus, 
    kitchenStatus, 
    barStatus,
    darkMode 
  } = useDashboard();
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  const userRoles = currentUser?.roles?.map(r => r.toUpperCase()) || [];
  const isKitchenOrBarStaff = userRoles.some(r => ['KITCHEN', 'CHEF', 'BAR', 'BARTENDER'].includes(r)) && !userRoles.some(r => ['ADMIN', 'MANAGER', 'CASHIER'].includes(r));

  // Render current module view based on sidebar selection
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div id="dashboard-grid-layout" className="space-y-6 animate-in fade-in duration-200">
            {/* Show financial operational KPIs only to Admin, Manager & Cashier */}
            {!isKitchenOrBarStaff && (
              <>
                {/* 1. Statistics Cards Block */}
                <div className="space-y-2">
                  <h2 className="font-display text-base font-extrabold text-slate-800 uppercase tracking-wide">Operational KPIs</h2>
                  <StatisticsCards />
                </div>

                {/* 2. Revenue Chart */}
                <div>
                  <RevenueChart />
                </div>
              </>
            )}

            {/* 3. Recent Transactions Listing */}
            <div>
              <RecentOrders onViewOrder={(order) => setSelectedOrderForReceipt(order)} />
            </div>

            {/* 4. Kitchen & Bar active summaries list */}
            <div className="space-y-2">
              <h3 className="font-display text-base font-extrabold text-slate-800 uppercase tracking-wide">Live Dispatch Consoles</h3>
              <KitchenBarSummary />
            </div>
          </div>
        );

      case 'pos':
        return <POSView onViewOrder={(order) => setSelectedOrderForReceipt(order)} />;

      case 'orders':
        return <OrdersView onViewOrder={(order) => setSelectedOrderForReceipt(order)} />;

      case 'kitchen':
        return <KitchenView />;

      case 'bar':
        return <BarView />;

      case 'users':
        return <UsersView />;

      case 'menu':
        return <MenuView />;

      case 'categories':
        return <CategoriesView />;

      case 'reports':
        return <ReportsView />;

      case 'settings':
        return <SettingsView />;

      default:
        return (
          <div className="py-12 text-center text-slate-400 text-xs">
            Unknown section selected.
          </div>
        );
    }
  };

  return (
    <div className={darkMode ? 'dark bg-slate-900 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-800'}>
      <DashboardLayout>
        {/* Simulation Warn Banners */}
        <div className="space-y-2 mb-4">
          {internetStatus === 'Disconnected' && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 animate-pulse">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-extrabold text-red-700">🔴 INTERNET OFFLINE:</span> Working in local cache mode. Transactions will automatically synchronize to central cloud when connection is restored.
            </div>
          )}
          {dbStatus === 'Disconnected' && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span className="font-extrabold text-rose-700">🚨 DATABASE SERVER ERROR:</span> Primary SQL Database offline. Transactions are being logged to the client-side failover replica automatically.
            </div>
          )}
          {printerStatus === 'Error' && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="font-extrabold text-amber-700">⚠️ PRINTER WARNING:</span> Receipt thermal printer reports paper roll empty or cover open. Check print cover.
            </div>
          )}
          {kitchenStatus === 'Offline' && (
            <div className="flex items-center gap-2 rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
              <span className="flex h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
              <span className="font-extrabold text-yellow-700">👨‍🍳 KITCHEN DISPATCH OFFLINE:</span> Kitchen monitor is currently offline or unpowered. Tickets are cached.
            </div>
          )}
        </div>

        {/* Dynamic Module Content */}
        {renderActiveView()}

        {/* Global Receipt Details Overlay Modal */}
        <AnimatePresence>
          {selectedOrderForReceipt && (
            <Modals
              order={selectedOrderForReceipt}
              onClose={() => setSelectedOrderForReceipt(null)}
            />
          )}
        </AnimatePresence>
      </DashboardLayout>
    </div>
  );
};

const LoginWrapper: React.FC = () => {
  const { currentUser, setCurrentUser } = useDashboard();
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage onLoginSuccess={() => setCurrentUser(authService.getCurrentUser())} />;
};

const DashboardWrapper: React.FC = () => {
  const { currentUser } = useDashboard();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <MainAppContent />;
};

export default function App() {
  return (
    <DashboardProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/*" element={<DashboardWrapper />} />
        </Routes>
      </Router>
    </DashboardProvider>
  );
}
