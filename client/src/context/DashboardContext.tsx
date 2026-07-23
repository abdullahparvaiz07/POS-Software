/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Order,
  OrderItem,
  QueueItem,
  User,
  Category,
  MenuItem,
  DashboardStats,
  OrderStatus,
  OrderType,
  TakeawayMode,
  QueueItemStatus,
  PaymentStatus,
  AppNotification,
  Activity
} from '../types';
// No mock data imports
import { AuthUser } from '../types/auth';
import { authService } from '../services/authService';
import { categoryService } from '../services/categoryService';
import { menuService } from '../services/menuService';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import { queueService } from '../services/queueService';
import { settingsService } from '../services/settingsService';

interface DashboardContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
  categories: Category[];
  users: User[];
  menuItems: MenuItem[];
  orders: Order[];
  orderItems: OrderItem[];
  queueItems: QueueItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  stats: DashboardStats;
  
  // Live Notifications
  notifications: AppNotification[];
  addNotification: (type: 'success' | 'warning' | 'info' | 'error', message: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Recent Activities
  activities: Activity[];
  addActivity: (actor: string, description: string) => void;

  // Live System Status
  kitchenStatus: 'Online' | 'Offline';
  barStatus: 'Online' | 'Offline';
  printerStatus: 'Connected' | 'Error' | 'Disconnected';
  dbStatus: 'Connected' | 'Disconnected';
  internetStatus: 'Connected' | 'Disconnected';
  
  toggleKitchenStatus: () => void;
  toggleBarStatus: () => void;
  togglePrinterStatus: () => void;
  toggleDbStatus: () => void;
  toggleInternetStatus: () => void;

  // Dark Mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Simulation actions
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
  updateQueueItemStatus: (queueItemId: number, status: QueueItemStatus) => void;
  cancelOrder: (orderId: number) => void;
  completeOrder: (orderId: number) => void;
  triggerPayment: (orderId: number) => void;
  refreshOrdersAndQueues: () => Promise<void>;
  resetAllData: () => void;
  
  // Additional dynamic Master Data operations
  addMenuItem: (item: Omit<MenuItem, 'id' | 'created_at'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: number) => void;
  toggleMenuItemAvailability: (itemId: number) => void;
  addCategory: (item: Omit<Category, 'id' | 'created_at'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: number) => void;
  toggleCategoryStatus: (categoryId: number) => void;
  addUser: (user: Omit<User, 'id' | 'created_at'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
  toggleUserStatus: (userId: number) => void;
  systemSettings: any;
  updateSystemSettings: (newSettings: any) => void;
  refreshSettings: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  const [systemSettings, setSystemSettings] = useState<any>({
    restaurantName: 'Restaurant POS',
    slogan: 'Fast & Fresh Dining',
    logo: '',
    phone: '+92 300 1234567',
    email: 'info@restaurant.com',
    address: 'Main Boulevard, Gulberg III',
    city: 'Lahore',
    country: 'Pakistan',
    currency: 'PKR',
    currencySymbol: 'PKR',
    taxPercentage: 16,
    serviceCharge: 5,
    ntn: '1234567-8',
    receiptHeader: 'Welcome to our Restaurant! Enjoy your meal.',
    receiptFooter: 'Thank you for dining with us! Please visit again.',
    showLogoOnReceipt: true,
    allowNegativeInventory: false
  });

  const updateSystemSettings = (newSettings: any) => {
    setSystemSettings((prev: any) => ({ ...prev, ...newSettings }));
  };

  const refreshSettings = async () => {
    try {
      const s = await settingsService.getSettings();
      if (s) setSystemSettings(s);
    } catch {
      // Ignore fallback
    }
  };

  // Fetch initial data from API
  useEffect(() => {
    if (!currentUser) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [cats, menus, usrList, ordList, kitchenQ, barQ, sysSet] = await Promise.all([
          categoryService.getAllCategories().catch(() => []),
          menuService.getAllMenuItems().catch(() => []),
          userService.getAllUsers().catch(() => []),
          orderService.getAllOrders().catch(() => []),
          queueService.getKitchenQueue().catch(() => []),
          queueService.getBarQueue().catch(() => []),
          settingsService.getSettings().catch(() => null)
        ]);
        
        setCategories(cats);
        setMenuItems(menus);
        setUsers(usrList);
        setOrders(ordList);
        setQueueItems([...kitchenQ, ...barQ]);
        if (sysSet) setSystemSettings(sysSet);
      } catch (err: any) {
        setError(err.message || "Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [currentUser?.id]);
  
  // Real-time Socket.IO Connection
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
    const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');
    
    const socket: Socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket.IO Connected');
    });

    socket.on('KITCHEN_QUEUE_UPDATED', (updatedItem: any) => {
      setQueueItems(prev => {
         const exists = prev.find(q => q.id === updatedItem.id);
         if (exists) return prev.map(q => q.id === updatedItem.id ? updatedItem : q);
         return [...prev, updatedItem];
      });
    });

    socket.on('ORDER_CREATED', (order: any) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === order.id);
        if (exists) return prev;
        return [...prev, orderService.mapOrder(order)];
      });
    });

    socket.on('ORDER_UPDATED', (order: any) => {
      setOrders(prev => {
         const exists = prev.find(o => o.id === order.id);
         if (exists) return prev.map(o => o.id === order.id ? orderService.mapOrder(order) : o);
         return [...prev, orderService.mapOrder(order)];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.id]);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Set default active tab based on user role when user logs in
  useEffect(() => {
    if (!currentUser) return;
    const userRoles = currentUser.roles?.map(r => r.toUpperCase()) || [];
    const isKitchenOnly = userRoles.some(r => ['KITCHEN', 'CHEF'].includes(r)) && !userRoles.some(r => ['ADMIN', 'MANAGER', 'CASHIER'].includes(r));
    const isBarOnly = userRoles.some(r => ['BAR', 'BARTENDER'].includes(r)) && !userRoles.some(r => ['ADMIN', 'MANAGER', 'CASHIER'].includes(r));

    if (isKitchenOnly) {
      setActiveTab('kitchen');
    } else if (isBarOnly) {
      setActiveTab('bar');
    }
  }, [currentUser?.id]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Recent Activities
  const [activities, setActivities] = useState<Activity[]>([]);

  // Live System Status
  const [kitchenStatus, setKitchenStatus] = useState<'Online' | 'Offline'>('Online');
  const [barStatus, setBarStatus] = useState<'Online' | 'Offline'>('Online');
  const [printerStatus, setPrinterStatus] = useState<'Connected' | 'Error' | 'Disconnected'>('Connected');
  const [dbStatus, setDbStatus] = useState<'Connected' | 'Disconnected'>('Connected');
  const [internetStatus, setInternetStatus] = useState<'Connected' | 'Disconnected'>('Connected');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    cashInHand: 0,
    totalOrders: 0,
    dineInOrders: 0,
    takeawayOrders: 0,
    deliveryOrders: 0,
    cancelledOrders: 0,
    cancelledRevenue: 0,
    creditOrders: 0,
    creditedAmount: 0,
    kitchenQueueCount: 0,
    barQueueCount: 0
  });

  // Automatically recalculate stats when orders, order items, or queue items change
  useEffect(() => {
    // Today's Revenue: Completed orders with Paid status
    const completedPaidOrders = orders.filter(o => o.status === 'Completed' && o.payment_status === 'Paid');
    const todayRevenue = completedPaidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Cash In Hand: Cash-paying completed orders (Dine-In, Takeaway counter/car, paid immediately in hand, excluding Delivery which is cash on delivery or rider holds)
    const cashInHandOrders = orders.filter(
      o => o.status === 'Completed' && 
           o.payment_status === 'Paid' && 
           (o.order_type === 'Dine-In' || (o.order_type === 'Takeaway' && o.takeaway_mode === 'Counter'))
    );
    const cashInHand = cashInHandOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Order Type statistics
    const totalOrders = orders.length;
    const dineInOrders = orders.filter(o => o.order_type === 'Dine-In').length;
    const takeawayOrders = orders.filter(o => o.order_type === 'Takeaway').length;
    const deliveryOrders = orders.filter(o => o.order_type === 'Delivery').length;

    // Cancellation statistics
    const cancelledOrdersList = orders.filter(o => o.status === 'Cancelled');
    const cancelledOrders = cancelledOrdersList.length;
    const cancelledRevenue = cancelledOrdersList.reduce((sum, o) => sum + o.total_amount, 0);

    // Credit Orders: Completed but Unpaid (outstanding corporate/member credits)
    const creditOrdersList = orders.filter(o => o.status === 'Completed' && o.payment_status === 'Unpaid');
    const creditOrders = creditOrdersList.length;
    const creditedAmount = creditOrdersList.reduce((sum, o) => sum + o.total_amount, 0);

    // Active Queue Counts: Items that are Pending, Preparing, or Ready
    const activeKitchenQueues = queueItems.filter(qi => {
      const associatedItem = menuItems.find(m => m.name === qi.menu_item_name);
      const isKitchen = associatedItem ? associatedItem.preparation_area === 'Kitchen' : true;
      return isKitchen && qi.status !== 'Completed';
    }).length;

    const activeBarQueues = queueItems.filter(qi => {
      const associatedItem = menuItems.find(m => m.name === qi.menu_item_name);
      const isBar = associatedItem ? associatedItem.preparation_area === 'Bar' : false;
      return isBar && qi.status !== 'Completed';
    }).length;

    setStats({
      todayRevenue,
      cashInHand,
      totalOrders,
      dineInOrders,
      takeawayOrders,
      deliveryOrders,
      cancelledOrders,
      cancelledRevenue,
      creditOrders,
      creditedAmount,
      kitchenQueueCount: activeKitchenQueues,
      barQueueCount: activeBarQueues
    });
  }, [orders, queueItems, menuItems]);

  // Dynamic notification injector
  const addNotification = (type: 'success' | 'warning' | 'info' | 'error', message: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Dynamic activity stream injector
  const addActivity = (actor: string, description: string) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      actor,
      description
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Status Toggles
  const toggleKitchenStatus = () => {
    setKitchenStatus(prev => {
      const next = prev === 'Online' ? 'Offline' : 'Online';
      addNotification(next === 'Online' ? 'success' : 'error', next === 'Online' ? 'Kitchen console is back online.' : 'Kitchen offline error: Console lost connection.');
      addActivity('System Monitor', `Kitchen Terminal changed to ${next}`);
      return next;
    });
  };

  const toggleBarStatus = () => {
    setBarStatus(prev => {
      const next = prev === 'Online' ? 'Offline' : 'Online';
      addNotification(next === 'Online' ? 'success' : 'error', next === 'Online' ? 'Bar console is back online.' : 'Bar offline error: Terminal disconnected.');
      addActivity('System Monitor', `Bar Terminal changed to ${next}`);
      return next;
    });
  };

  const togglePrinterStatus = () => {
    setPrinterStatus(prev => {
      const next = prev === 'Connected' ? 'Error' : (prev === 'Error' ? 'Disconnected' : 'Connected');
      addNotification(next === 'Connected' ? 'success' : 'error', next === 'Connected' ? 'Thermal Receipt Printer is now online and connected.' : (next === 'Error' ? 'Printer warning: Paper jam or ribbon low.' : 'Printer error: Printer disconnected.'));
      addActivity('System Monitor', `Receipt Printer set to ${next}`);
      return next;
    });
  };

  const toggleDbStatus = () => {
    setDbStatus(prev => {
      const next = prev === 'Connected' ? 'Disconnected' : 'Connected';
      addNotification(next === 'Connected' ? 'success' : 'error', next === 'Connected' ? 'SQL Database synchronization restored.' : 'Server Error: SQL database connection timed out.');
      addActivity('System Monitor', `Database link state set to ${next}`);
      return next;
    });
  };

  const toggleInternetStatus = () => {
    setInternetStatus(prev => {
      const next = prev === 'Connected' ? 'Disconnected' : 'Connected';
      addNotification(next === 'Connected' ? 'success' : 'error', next === 'Connected' ? 'Broadband connection active. Cloud sync complete.' : 'Internet connection disconnected. Running in fallback offline mode.');
      addActivity('System Monitor', `WAN Link state set to ${next}`);
      return next;
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      addActivity('Cashier Abdullah', `Toggled ${next ? 'Dark Mode' : 'Light Mode'}`);
      return next;
    });
  };

  // ACTION SIMULATORS

  // 1. Create Order (Migrated directly to POSView.tsx)

  // Refresh Orders and Queues
  const refreshOrdersAndQueues = async () => {
    try {
      const [ordList, kitchenQ, barQ] = await Promise.all([
        orderService.getAllOrders(),
        queueService.getKitchenQueue(),
        queueService.getBarQueue()
      ]);
      setOrders(ordList);
      setQueueItems([...kitchenQ, ...barQ]);
    } catch (e: any) {
      console.error("Failed to refresh orders and queues", e);
    }
  };

  // 2. Update Order Status
  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      if (status === 'Completed') {
        await orderService.completeOrder(orderId);
      } else if (status === 'Cancelled') {
        await orderService.cancelOrder(orderId);
      } else {
        await orderService.updateOrderStatus(orderId, status);
      }

      // Refresh orders and queues
      const [ordList, kitchenQ, barQ] = await Promise.all([
        orderService.getAllOrders(),
        queueService.getKitchenQueue(),
        queueService.getBarQueue()
      ]);
      setOrders(ordList);
      setQueueItems([...kitchenQ, ...barQ]);

      const o = ordList.find((x: any) => x.id === orderId);
      if (o) {
        addNotification(status === 'Completed' ? 'success' : (status === 'Cancelled' ? 'warning' : 'info'), `Order ${o.order_number} is now ${status}`);
        addActivity('System', `Updated Order #${o.order_number} status to ${status}`);
      }
    } catch (e: any) {
      addNotification('error', `Failed to update order status: ${e.message}`);
    }
  };

  // 3. Update Queue Item Status
  const updateQueueItemStatus = async (queueItemId: number, status: QueueItemStatus) => {
    const targetQueueItem = queueItems.find(q => q.id === queueItemId);
    if (!targetQueueItem) return;

    try {
      const associatedItem = menuItems.find(m => m.name === targetQueueItem.menu_item_name);
      const isKitchen = associatedItem ? associatedItem.preparation_area === 'Kitchen' : true;
      
      if (isKitchen) {
        await queueService.updateKitchenItemStatus(queueItemId, status);
      } else {
        await queueService.updateBarItemStatus(queueItemId, status);
      }

      // Refresh orders and queues to capture cascade logic from backend
      const [ordList, kitchenQ, barQ] = await Promise.all([
        orderService.getAllOrders(),
        queueService.getKitchenQueue(),
        queueService.getBarQueue()
      ]);
      setOrders(ordList);
      setQueueItems([...kitchenQ, ...barQ]);

      const areaName = isKitchen ? 'Kitchen' : 'Bar';
      if (status === 'Ready') {
        addNotification('success', `${areaName} completed preparation for ${targetQueueItem.menu_item_name} (${targetQueueItem.order_number})`);
        addActivity(areaName, `Completed cooking ${targetQueueItem.menu_item_name} for Order #${targetQueueItem.order_number}`);
      } else {
        addActivity(areaName, `Started preparing ${targetQueueItem.menu_item_name} for Order #${targetQueueItem.order_number}`);
      }
    } catch (e: any) {
      addNotification('error', `Failed to update queue item status: ${e.message}`);
    }
  };

  // 4. Cancel
  const cancelOrder = (orderId: number) => {
    updateOrderStatus(orderId, 'Cancelled');
  };

  // 5. Complete
  const completeOrder = (orderId: number) => {
    updateOrderStatus(orderId, 'Completed');
  };

  // 6. Pay
  const triggerPayment = async (orderId: number) => {
    try {
      const paidOrder = await orderService.triggerPayment(orderId, 'CASH');
      setOrders(prev => prev.map(o => o.id === orderId ? paidOrder : o));
      addNotification('success', `Payment verified for Order #${paidOrder.order_number}`);
      addActivity('System', `Processed payment for Order #${paidOrder.order_number}`);
    } catch (e: any) {
      addNotification('error', `Failed to process payment: ${e.message}`);
    }
  };

  // CRUD master actions
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
    try {
      const newItem = await menuService.createMenuItem(item);
      setMenuItems(prev => [...prev, newItem]);
      addNotification('success', `Menu item "${item.name}" registered successfully.`);
      addActivity('System', `Added menu item "${item.name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to add menu item: ${e.message}`);
    }
  };

  const updateMenuItem = async (updatedItem: MenuItem) => {
    try {
      const newItem = await menuService.updateMenuItem(updatedItem.id, updatedItem);
      setMenuItems(prev => prev.map(item => item.id === newItem.id ? newItem : item));
      addNotification('success', `Menu item "${updatedItem.name}" updated successfully.`);
      addActivity('System', `Updated menu item "${updatedItem.name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to update menu item: ${e.message}`);
    }
  };

  const deleteMenuItem = async (itemId: number) => {
    try {
      const found = menuItems.find(item => item.id === itemId);
      await menuService.deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      if (found) {
        addNotification('success', `Menu item "${found.name}" deleted.`);
        addActivity('System', `Deleted menu item "${found.name}"`);
      }
    } catch (e: any) {
      addNotification('error', `Failed to delete menu item: ${e.message}`);
    }
  };

  const toggleMenuItemAvailability = async (itemId: number) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    try {
      const nextStatus = !item.is_available;
      const updated = await menuService.toggleAvailability(itemId, nextStatus);
      setMenuItems(prev => prev.map(i => i.id === itemId ? updated : i));
      addNotification('info', `Menu item "${item.name}" is now ${nextStatus ? 'Available' : 'Unavailable'}.`);
    } catch (e: any) {
      addNotification('error', `Failed to toggle availability: ${e.message}`);
    }
  };

  const addCategory = async (item: Omit<Category, 'id' | 'created_at'>) => {
    try {
      const newCat = await categoryService.createCategory(item);
      setCategories(prev => [...prev, newCat]);
      addNotification('success', `Category "${item.name}" created successfully.`);
      addActivity('System', `Created item category "${item.name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to create category: ${e.message}`);
    }
  };

  const updateCategory = async (updatedCat: Category) => {
    try {
      const newCat = await categoryService.updateCategory(updatedCat.id, updatedCat);
      setCategories(prev => prev.map(c => c.id === newCat.id ? newCat : c));
      addNotification('success', `Category "${updatedCat.name}" updated successfully.`);
      addActivity('System', `Updated item category "${updatedCat.name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to update category: ${e.message}`);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      const found = categories.find(c => c.id === categoryId);
      await categoryService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      if (found) {
        addNotification('success', `Category "${found.name}" deleted.`);
        addActivity('System', `Deleted category "${found.name}"`);
      }
    } catch (e: any) {
      addNotification('error', `Failed to delete category: ${e.message}`);
    }
  };

  const toggleCategoryStatus = async (categoryId: number) => {
    const c = categories.find(cat => cat.id === categoryId);
    if (!c) return;
    try {
      const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await categoryService.toggleStatus(categoryId, nextStatus === 'Active');
      setCategories(prev => prev.map(cat => cat.id === categoryId ? updated : cat));
      addNotification('info', `Category "${c.name}" is now ${nextStatus}.`);
    } catch (e: any) {
      addNotification('error', `Failed to toggle category status: ${e.message}`);
    }
  };

  const addUser = async (member: Omit<User, 'id' | 'created_at'>) => {
    try {
      const newMember = await userService.createUser(member);
      setUsers(prev => [...prev, newMember]);
      addNotification('success', `User "${member.full_name}" registered successfully.`);
      addActivity('System', `Registered user "${member.full_name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to create user: ${e.message}`);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      const newMember = await userService.updateUser(updatedUser.id, updatedUser);
      setUsers(prev => prev.map(u => u.id === newMember.id ? newMember : u));
      addNotification('success', `User "${updatedUser.full_name}" updated successfully.`);
      addActivity('System', `Updated profile of user "${updatedUser.full_name}"`);
    } catch (e: any) {
      addNotification('error', `Failed to update user: ${e.message}`);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const found = users.find(u => u.id === userId);
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (found) {
        addNotification('success', `User "${found.full_name}" deleted.`);
        addActivity('System', `Deleted user "${found.full_name}"`);
      }
    } catch (e: any) {
      addNotification('error', `Failed to delete user: ${e.message}`);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    const u = users.find(user => user.id === userId);
    if (!u) return;
    try {
      const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await userService.toggleStatus(userId, nextStatus === 'Active');
      setUsers(prev => prev.map(user => user.id === userId ? updated : user));
      addNotification('info', `User "${u.full_name}" is now ${nextStatus}.`);
    } catch (e: any) {
      addNotification('error', `Failed to toggle user status: ${e.message}`);
    }
  };

  // 7. Reset all
  const resetAllData = () => {
    setOrders([]);
    setOrderItems([]);
    setQueueItems([]);
    setCategories([]);
    setUsers([]);
    setMenuItems([]);
    setNotifications([
      { id: 'notif-1', type: 'success', message: 'Kitchen completed Order #ORD-0713-001 items', timestamp: '10:24 AM', isRead: false },
      { id: 'notif-2', type: 'success', message: 'Bar completed Order #ORD-0713-002 items', timestamp: '10:20 AM', isRead: false },
      { id: 'notif-3', type: 'info', message: 'Delivery assigned to Bilal Shah', timestamp: '10:15 AM', isRead: true },
      { id: 'notif-4', type: 'info', message: 'Cashier Abdullah logged in successfully', timestamp: '09:00 AM', isRead: true }
    ]);
    setActivities([
      { id: 'act-1', time: '10:27 AM', actor: 'Waiter Ahmed', description: 'Delivered Order #ORD-0713-002' },
      { id: 'act-2', time: '10:24 AM', actor: 'Kitchen', description: 'Completed preparation for Mint Margarita' }
    ]);
    setKitchenStatus('Online');
    setBarStatus('Online');
    setPrinterStatus('Connected');
    setDbStatus('Connected');
    setInternetStatus('Connected');
    setDarkMode(false);
    setError(null);
    setIsLoading(false);
  };

  return (
    <DashboardContext.Provider value={{
      currentUser,
      setCurrentUser,
      logout,
      categories,
      users,
      menuItems,
      orders,
      orderItems,
      queueItems,
      activeTab,
      setActiveTab,
      isLoading,
      setIsLoading,
      error,
      setError,
      stats,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      activities,
      addActivity,
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
      darkMode,
      toggleDarkMode,
      refreshOrdersAndQueues,
      updateOrderStatus,
      updateQueueItemStatus,
      cancelOrder,
      completeOrder,
      triggerPayment,
      resetAllData,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleMenuItemAvailability,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
      addUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      systemSettings,
      updateSystemSettings,
      refreshSettings
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
