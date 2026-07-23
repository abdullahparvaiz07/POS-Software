/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Clock, ChefHat, User, Settings, CheckCircle2, 
  AlertTriangle, HelpCircle, Wifi, WifiOff, Printer, Database, 
  Coffee, Monitor, Moon, Sun, Trash2, ShieldCheck, X, ChevronRight, UserCheck,
  LogOut
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { 
    currentUser,
    logout,
    queueItems, 
    orders, 
    notifications, 
    markNotificationAsRead, 
    clearNotifications,
    kitchenStatus, 
    barStatus, 
    printerStatus, 
    dbStatus, 
    internetStatus,
    darkMode,
    toggleDarkMode,
    menuItems,
    categories,
    users,
    setActiveTab,
    systemSettings
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  
  // Notification shaking state
  const [shouldShake, setShouldShake] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 800);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle outside click to close search popup
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format time beautifully
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Search everywhere logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();

    // 1. Match Orders
    const matchedOrders = orders.filter(o => 
      o.order_number.toLowerCase().includes(query) ||
      o.order_type.toLowerCase().includes(query) ||
      o.status.toLowerCase().includes(query) ||
      (o.customer_notes && o.customer_notes.toLowerCase().includes(query))
    ).slice(0, 4);

    // 2. Match Menu Items
    const matchedMenu = menuItems.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      m.preparation_area.toLowerCase().includes(query)
    ).slice(0, 4);

    // 3. Match Categories
    const matchedCategories = categories.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    ).slice(0, 4);

    // 4. Match Users
    const matchedUsers = users.filter(s => 
      s.full_name.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.capabilities.some(c => c.toLowerCase().includes(query)) ||
      s.address.toLowerCase().includes(query)
    ).slice(0, 4);

    // 5. Match simulated Customers
    const simulatedCustomers = [
      { name: 'Abid Chaudhry', phone: '+92 300 8452132', email: 'abid@gmail.com' },
      { name: 'Ayesha Malik', phone: '+92 321 4452199', email: 'ayesha.m@outlook.com' },
      { name: 'Zainab Siddiqui', phone: '+92 333 9128374', email: 'zainab99@yahoo.com' },
      { name: 'Noman Butt', phone: '+92 345 7712398', email: 'noman@butt.com' }
    ].filter(cust => 
      cust.name.toLowerCase().includes(query) ||
      cust.phone.includes(query) ||
      cust.email.toLowerCase().includes(query)
    );

    const hasResults = 
      matchedOrders.length > 0 || 
      matchedMenu.length > 0 || 
      matchedCategories.length > 0 || 
      matchedUsers.length > 0 ||
      simulatedCustomers.length > 0;

    return {
      orders: matchedOrders,
      menu: matchedMenu,
      categories: matchedCategories,
      users: matchedUsers,
      customers: simulatedCustomers,
      hasResults
    };
  };

  const results = getSearchResults();

  return (
    <nav id="navbar-main" className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Brand Logo Area */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200">
          {systemSettings?.logo ? (
            <img src={systemSettings.logo} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <ChefHat className="h-6 w-6" />
          )}
        </div>
        <div>
          <span className="font-display text-lg font-extrabold tracking-tight text-slate-800">
            {systemSettings?.restaurantName || 'Restaurant POS'}
          </span>
          <span className="ml-2 rounded-md bg-orange-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-orange-600 uppercase">
            POS Terminal
          </span>
        </div>
      </div>

      {/* Global Search Bar with Search Everywhere Popup */}
      <div ref={searchContainerRef} className="relative hidden max-w-md flex-1 px-8 md:block">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="navbar-search"
            type="text"
            placeholder="Search everywhere (menu, orders, staff, customers...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-8 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Popover */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-8 right-8 top-12 z-50 max-h-[480px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in duration-100">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Search Results</span>
              <span>Everywhere Finder</span>
            </div>

            {results && results.hasResults ? (
              <div className="space-y-4">
                {/* Orders Block */}
                {results.orders.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-1 mb-1.5">
                      <Monitor className="h-3 w-3 text-blue-500" /> Orders
                    </h4>
                    <div className="space-y-1">
                      {results.orders.map(order => (
                        <button
                          key={`search-order-${order.id}`}
                          onClick={() => {
                            setActiveTab('orders');
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                        >
                          <span className="font-semibold">{order.order_number}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{order.order_type}</span>
                          <span className={`font-mono font-medium ${order.status === 'Completed' ? 'text-emerald-600' : 'text-orange-500'}`}>
                            {order.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu Items Block */}
                {results.menu.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-1 mb-1.5">
                      <Coffee className="h-3 w-3 text-orange-500" /> Menu Items
                    </h4>
                    <div className="space-y-1">
                      {results.menu.map(item => (
                        <button
                          key={`search-menu-${item.id}`}
                          onClick={() => {
                            setActiveTab('pos');
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-[10px] text-slate-400 max-w-[280px] truncate">{item.description}</p>
                          </div>
                          <span className="font-mono font-bold text-orange-600 shrink-0">PKR {item.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Block */}
                {results.categories.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-1 mb-1.5">
                      <Settings className="h-3 w-3 text-purple-500" /> Categories
                    </h4>
                    <div className="space-y-1">
                      {results.categories.map(cat => (
                        <button
                          key={`search-cat-${cat.id}`}
                          onClick={() => {
                            setActiveTab('categories');
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                        >
                          <span className="font-semibold">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 max-w-[200px] truncate">{cat.description}</span>
                          <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Block */}
                {results.users.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-1 mb-1.5">
                      <UserCheck className="h-3 w-3 text-emerald-500" /> Users
                    </h4>
                    <div className="space-y-1">
                      {results.users.map(member => (
                        <button
                          key={`search-staff-${member.id}`}
                          onClick={() => {
                            setActiveTab('users');
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                        >
                          <div>
                            <p className="font-semibold">{member.full_name}</p>
                            <p className="text-[10px] text-slate-400">{member.phone}</p>
                          </div>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 font-medium">
                            {member.capabilities.join(', ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated Customers Block */}
                {results.customers.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-1 mb-1.5">
                      <User className="h-3 w-3 text-indigo-500" /> Customers (CRM File)
                    </h4>
                    <div className="space-y-1">
                      {results.customers.map((cust, idx) => (
                        <div
                          key={`search-cust-${idx}`}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-left text-xs text-slate-700"
                        >
                          <div>
                            <p className="font-bold text-indigo-900">{cust.name}</p>
                            <p className="text-[10px] text-slate-400">{cust.email}</p>
                          </div>
                          <span className="font-mono font-medium text-[11px] text-indigo-600 shrink-0">
                            {cust.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">No system records found</p>
                <p className="text-[11px] text-slate-400">Try searching for other keywords (e.g. "Burger", "Zainab", "ORD")</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Navbar Controls */}
      <div className="flex items-center gap-4">
        {/* Connection status display tray */}
        <div 
          onClick={() => setShowStatusPanel(!showStatusPanel)}
          className="relative hidden items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 border border-slate-200/60 cursor-pointer hover:bg-slate-100 transition-all sm:flex"
          title="System Connection Center"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${internetStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>LAN</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>DB</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${printerStatus === 'Connected' ? 'bg-emerald-500' : (printerStatus === 'Error' ? 'bg-amber-500 animate-pulse' : 'bg-red-500')}`} />
            <span>PRINTER</span>
          </div>

          {/* Device status popover (read-only) */}
          {showStatusPanel && (
            <div className="absolute right-0 top-9 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xl ring-1 ring-black/5">
              <div className="mb-2.5 border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">System Status</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Network</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${internetStatus === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {internetStatus === 'Connected' ? '● Online' : '● Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Database</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${dbStatus === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {dbStatus === 'Connected' ? '● Connected' : '● Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Printer</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${printerStatus === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {printerStatus === 'Connected' ? '● Ready' : '● Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Clock Display */}
        <div className="hidden flex-col items-end border-r border-slate-200 pr-4 text-right lg:flex">
          <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            {formatTime(time)}
          </div>
          <span className="text-[10px] font-bold text-slate-400">{formatDate(time)} (PKT)</span>
        </div>

        {/* Action Tray */}
        <div className="relative flex items-center gap-2">
          {/* Notification Button */}
          <button
            id="btn-notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowStatusPanel(false);
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all duration-200 active:scale-95 cursor-pointer ${shouldShake ? 'animate-bell-shake border-orange-400 text-orange-500' : ''}`}
          >
            <Bell className={`h-4.5 w-4.5 ${shouldShake ? 'scale-110' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 font-mono text-[9px] font-bold text-white ring-2 ring-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Settings Navigation Button */}
          <button
            id="btn-settings-nav"
            onClick={() => {
              setActiveTab('settings');
            }}
            title="Open Settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-orange-500 focus:outline-none active:scale-95 cursor-pointer transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Dynamic Notification Panel Popover */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                id="popover-notifications" 
                className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl ring-1 ring-black/5"
              >
                <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-tight">Active Alerts</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold text-red-600">{unreadCount} New</span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <ShieldCheck className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                      No active system notifications
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const bgClass = notif.type === 'success' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
                                      notif.type === 'warning' ? 'bg-amber-50 border-amber-400 text-amber-900' :
                                      notif.type === 'error' ? 'bg-red-50 border-red-400 text-red-900' :
                                      'bg-blue-50 border-blue-400 text-blue-900';

                      const Icon = notif.type === 'success' ? CheckCircle2 :
                                   notif.type === 'warning' ? AlertTriangle :
                                   notif.type === 'error' ? AlertTriangle : HelpCircle;

                      return (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`group flex cursor-pointer gap-2.5 rounded-xl border-l-4 p-2.5 text-xs transition-all duration-200 hover:bg-slate-50 ${bgClass} ${notif.isRead ? 'opacity-65' : ''}`}
                        >
                          <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold leading-snug">{notif.message}</p>
                            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                              <span>{notif.timestamp}</span>
                              {!notif.isRead && (
                                <span className="text-[8px] font-bold text-orange-500 uppercase">Mark read</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile area */}
        <div id="profile-container" className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="hidden flex-col text-right sm:flex">
            <span className="font-display text-xs font-extrabold text-slate-800">
              {currentUser?.fullName || 'User'}
            </span>
            <span className="text-[10px] font-semibold text-orange-500 uppercase">
              {currentUser?.roles?.join(' / ') || 'Staff'}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 font-bold text-white text-sm ring-2 ring-orange-100 border border-white">
            {(currentUser?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => {
              logout();
            }}
            title="Log Out Terminal"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
