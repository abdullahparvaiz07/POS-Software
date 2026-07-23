/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { MenuItem, OrderType, TakeawayMode } from '../../types';
import { formatPKR } from './StatisticsCards';
import { orderService } from '../../services/orderService';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Search, 
  Coffee, 
  Package, 
  Bike, 
  CheckSquare, 
  CreditCard,
  X,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Real-time animated number interpolation hook/component
export const AnimatedNumber: React.FC<{ value: number; formatter?: (v: number) => string }> = ({ value, formatter }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const duration = 200; // Fast and snappy (200ms)

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{formatter ? formatter(displayValue) : Math.round(displayValue)}</>;
};

interface CartItem {
  cartItemId?: string;
  menuItem: MenuItem;
  quantity: number;
  variantName?: string;
  variantPrice?: number;
  size?: string;
}

interface POSViewProps {
  onViewOrder?: (order: any) => void;
}

export const POSView: React.FC<POSViewProps> = ({ onViewOrder }) => {
  const queryClient = useQueryClient();
  const { menuItems, categories, users, refreshOrdersAndQueues, addNotification, addActivity, setActiveTab } = useDashboard();
  const [selectedCategory, setSelectedStaffCategory] = useState<number | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // UX micro-animation states
  const [clickedItemId, setClickedItemId] = useState<number | null>(null);
  const [rippleCardId, setRippleCardId] = useState<number | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Checkout Properties
  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [takeawayMode, setTakeawayMode] = useState<TakeawayMode>('Counter');
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [assignmentMode, setAssignmentMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedWaiterId, setSelectedWaiterId] = useState<number | undefined>(undefined);
  const [selectedRiderId, setSelectedRiderId] = useState<number | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Extra Delivery Fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);

  // Filter products
  const filteredProducts = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' ? true : item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get available Waiters & Riders supporting multiple roles with fallbacks
  const availableWaiters = users.filter(s => {
    if (!s) return false;
    const caps = s.capabilities || [];
    if (caps.some(c => c.toLowerCase().includes('waiter'))) return true;
    if ((s as any).userRoles?.some((ur: any) => ur.role?.name?.toLowerCase().includes('waiter'))) return true;
    if ((s as any).role?.toLowerCase().includes('waiter')) return true;
    return false;
  });
  const activeWaitersList = availableWaiters.length > 0 ? availableWaiters : users;

  const availableRiders = users.filter(s => {
    if (!s) return false;
    const caps = s.capabilities || [];
    if (caps.some(c => c.toLowerCase().includes('rider'))) return true;
    if ((s as any).userRoles?.some((ur: any) => ur.role?.name?.toLowerCase().includes('rider'))) return true;
    if ((s as any).role?.toLowerCase().includes('rider')) return true;
    return false;
  });
  const activeRidersList = availableRiders.length > 0 ? availableRiders : users;

  // Assigned staff helper for display in cart bucket
  const getAssignedStaffDisplay = () => {
    if (orderType === 'Takeaway' && takeawayMode === 'Counter') {
      return { role: 'Counter Staff', name: 'Cashier Abdullah', icon: '👤', isAuto: false };
    }
    
    if (orderType === 'Delivery') {
      if (assignmentMode === 'MANUAL' && selectedRiderId) {
        const rider = users.find(u => u.id === selectedRiderId);
        return { role: 'Delivery Rider', name: rider ? rider.full_name : 'Selected Rider', icon: '🛵', isAuto: false };
      }
      const defaultRider = activeRidersList[0];
      return { role: 'Delivery Rider', name: defaultRider ? defaultRider.full_name : 'Auto-Assigned Rider', icon: '⚡ 🛵', isAuto: true };
    }

    // Dine-In or Takeaway Car
    if (assignmentMode === 'MANUAL' && selectedWaiterId) {
      const waiter = users.find(u => u.id === selectedWaiterId);
      return { role: 'Waiter', name: waiter ? waiter.full_name : 'Selected Waiter', icon: '🍽️', isAuto: false };
    }
    const defaultWaiter = activeWaitersList[0];
    return { role: 'Waiter', name: defaultWaiter ? defaultWaiter.full_name : 'Auto-Assigned Waiter', icon: '⚡ 🍽️', isAuto: true };
  };

  const assignedStaff = getAssignedStaffDisplay();

  // Variant Modal State
  const [variantModalProduct, setVariantModalProduct] = useState<MenuItem | null>(null);

  // Cart operations with size variant support
  const addToCartWithVariant = (item: MenuItem, variantName?: string, variantPrice?: number) => {
    if (!item.is_available) {
      addNotification('error', `${item.name} is currently out of stock.`);
      return;
    }

    const sizeName = (variantName && variantName.trim().toLowerCase() !== 'regular') ? variantName.trim() : undefined;
    const cartItemId = `${item.id}_${sizeName || 'default'}`;

    setCart(prev => {
      const existing = prev.find(ci => ci.cartItemId === cartItemId);
      if (existing) {
        return prev.map(ci => ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, {
        cartItemId,
        menuItem: item,
        quantity: 1,
        variantName: sizeName,
        variantPrice: variantPrice ?? item.price,
        size: sizeName
      }];
    });

    setClickedItemId(item.id);
    setRippleCardId(item.id);
    setTimeout(() => setClickedItemId(null), 1000);
    setTimeout(() => setRippleCardId(null), 500);
  };

  const handleAddToBasketClick = (product: MenuItem) => {
    if (!product.is_available) {
      addNotification('error', `${product.name} is currently out of stock.`);
      return;
    }

    const variants = product.variants || [];

    // If item has 2 or more size variants, open size selection modal
    if (variants.length > 1) {
      setVariantModalProduct(product);
      return;
    }

    // If item has 1 variant or no variants, add to cart bucket directly
    const singleVar = variants.length === 1 ? variants[0] : null;
    const vName = singleVar && singleVar.name && singleVar.name.trim().toLowerCase() !== 'regular' ? singleVar.name : undefined;
    const vPrice = singleVar ? Number(singleVar.price) : product.price;

    addToCartWithVariant(product, vName, vPrice);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(ci => ci.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(ci => {
      if (ci.cartItemId === cartItemId) {
        const newQty = ci.quantity + delta;
        return newQty > 0 ? { ...ci, quantity: newQty } : ci;
      }
      return ci;
    }));
  };

  const getItemUnitPrice = (ci: CartItem) => {
    if (ci.variantPrice !== undefined && ci.variantPrice > 0) return ci.variantPrice;
    return ci.menuItem.price;
  };

  // Calculate Subtotal & Tax & Discount
  const cartSubtotal = cart.reduce((sum, ci) => sum + getItemUnitPrice(ci) * ci.quantity, 0);
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const subtotalAfterDiscount = cartSubtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * 0.16; // 16% POS sales tax
  const cartTotal = subtotalAfterDiscount + taxAmount;
  
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = cashNum > cartTotal ? cashNum - cartTotal : 0;

  // Keyboard Navigation & Focus Engine State
  const [focusedSection, setFocusedSection] = useState<'CATALOG' | 'BASKET' | 'SEARCH' | 'VARIANT_MODAL'>('CATALOG');
  const [focusedProductIndex, setFocusedProductIndex] = useState<number>(0);
  const [focusedBasketIndex, setFocusedBasketIndex] = useState<number>(0);
  const [focusedVariantIndex, setFocusedVariantIndex] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const lastEnterTimeRef = useRef<number>(0);

  // Keep focusedProductIndex within valid boundaries when filtering changes
  useEffect(() => {
    if (focusedProductIndex >= filteredProducts.length) {
      setFocusedProductIndex(Math.max(0, filteredProducts.length - 1));
    }
  }, [filteredProducts.length]);

  // Keep focusedBasketIndex within valid boundaries when cart changes
  useEffect(() => {
    if (focusedBasketIndex >= cart.length) {
      setFocusedBasketIndex(Math.max(0, cart.length - 1));
    }
  }, [cart.length]);

  // Reset variant index when variant modal opens
  useEffect(() => {
    if (variantModalProduct) {
      setFocusedVariantIndex(0);
      setFocusedSection('VARIANT_MODAL');
    }
  }, [variantModalProduct]);

  // Process checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      addNotification('warning', 'Your shopping cart is empty!');
      return;
    }

    const tableNum = orderType === 'Dine-In' ? tableNumber : null;
    const mode = orderType === 'Takeaway' ? takeawayMode : null;

    const payloadItems = cart.map(ci => {
      const itemPayload: any = {
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity
      };
      if (ci.variantName) {
        itemPayload.customVariantName = ci.variantName;
        itemPayload.customVariantPrice = getItemUnitPrice(ci);
      }
      return itemPayload;
    });

    try {
      const payload = {
        orderType: orderType === 'Dine-In' ? 'DINE_IN' : orderType.toUpperCase().replace('-', '_'),
        takeawayMode: mode ? mode.toUpperCase() : undefined,
        tableNumber: tableNum || undefined,
        customerName: customerName || (orderType === 'Delivery' ? (deliveryAddress || 'Customer') : undefined),
        customerPhone: orderType === 'Delivery' ? (customerPhone || '0300-1234567') : undefined,
        waiterId: (orderType === 'Dine-In' || (orderType === 'Takeaway' && takeawayMode === 'Car')) && assignmentMode === 'MANUAL' ? selectedWaiterId : undefined,
        deliveryRiderId: orderType === 'Delivery' && assignmentMode === 'MANUAL' ? selectedRiderId : undefined,
        assignmentMethod: assignmentMode,
        paymentMethod: 'CASH',
        discountPercent: discountPercent,
        taxPercent: 16,
        notes: customerNotes,
        items: payloadItems
      };
      
      const newOrder = await orderService.createOrder(payload);
      
      if (cashNum >= cartTotal && cashNum > 0) {
        await orderService.triggerPayment(newOrder.id, 'CASH').catch(() => {});
      }

      await refreshOrdersAndQueues();
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

      addNotification('success', `Order #${newOrder.order_number || newOrder.id} successfully created!`);
      addActivity('System', `Created Order #${newOrder.order_number || newOrder.id}`);

      // Reset cart and checkout properties
      setCart([]);
      setCustomerNotes('');
      setDiscountPercent(0);
      setCashTendered('');
      setDeliveryAddress('');
      setCustomerPhone('');
      setIsCartMobileOpen(false);
      setFocusedSection('CATALOG');
      setFocusedProductIndex(0);
      
      // Open receipt modal automatically
      if (onViewOrder) {
        onViewOrder(newOrder);
      }

    } catch (e: any) {
      console.error("Checkout error:", e);
      addNotification('error', `Failed to checkout: ${e.response?.data?.message || e.message || 'Server error'}`);
    }
  };

  // Enterprise POS Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
      );

      // F1 -> Toggle Shortcuts Help Modal
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
        return;
      }

      // Escape -> Close Help Modal, Variant Modal, or return to Catalog
      if (e.key === 'Escape') {
        if (showHelpModal) {
          setShowHelpModal(false);
          return;
        }
        if (variantModalProduct) {
          setVariantModalProduct(null);
          setFocusedSection('CATALOG');
          return;
        }
        if (isSearchFocused) {
          searchInputRef.current?.blur();
          setIsSearchFocused(false);
          setFocusedSection('CATALOG');
          return;
        }
        if (focusedSection === 'BASKET') {
          setFocusedSection('CATALOG');
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
      }

      // Ctrl + F -> Focus Search Input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusedSection('SEARCH');
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
        return;
      }

      // Ctrl + B -> Focus Basket Section
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (cart.length === 0) {
          addNotification('warning', 'Basket is empty! Add items from catalog.');
          return;
        }
        setFocusedSection('BASKET');
        setFocusedBasketIndex(0);
        return;
      }

      // Ctrl + P -> Focus Payment / Cash Received Field
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (cart.length === 0) {
          addNotification('warning', 'Add items to basket before taking payment.');
          return;
        }
        cashInputRef.current?.focus();
        return;
      }

      // Ctrl + N -> Create New Order (Reset Cart & Filters)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCart([]);
        setSearchQuery('');
        setCashTendered('');
        setCustomerNotes('');
        setCustomerName('');
        setDeliveryAddress('');
        setCustomerPhone('');
        setFocusedSection('CATALOG');
        setFocusedProductIndex(0);
        addNotification('info', 'New order initialized.');
        return;
      }

      // Ctrl + S -> Submit Current Order & Print Receipt
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // If currently typing inside an input element
      if (isTyping) {
        if (e.key === 'Enter' && activeElement === searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.blur();
          setIsSearchFocused(false);
          setFocusedSection('CATALOG');
          setFocusedProductIndex(0);
        }
        return;
      }

      // Tab / Shift+Tab -> Cycle interface sections logically
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: Backward
          if (focusedSection === 'BASKET') setFocusedSection('CATALOG');
          else if (focusedSection === 'CATALOG') {
            setFocusedSection('SEARCH');
            searchInputRef.current?.focus();
          } else if (focusedSection === 'SEARCH') {
            if (cart.length > 0) {
              setFocusedSection('BASKET');
              setFocusedBasketIndex(0);
            } else setFocusedSection('CATALOG');
          }
        } else {
          // Tab: Forward
          if (focusedSection === 'SEARCH') setFocusedSection('CATALOG');
          else if (focusedSection === 'CATALOG') {
            if (cart.length > 0) {
              setFocusedSection('BASKET');
              setFocusedBasketIndex(0);
            } else {
              setFocusedSection('SEARCH');
              searchInputRef.current?.focus();
            }
          } else if (focusedSection === 'BASKET') {
            setFocusedSection('SEARCH');
            searchInputRef.current?.focus();
          }
        }
        return;
      }

      // --- VARIANT SELECTION MODAL CONTROLS ---
      if (variantModalProduct && variantModalProduct.variants) {
        const vCount = variantModalProduct.variants.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedVariantIndex(prev => (prev + 1) % vCount);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedVariantIndex(prev => (prev - 1 + vCount) % vCount);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const now = Date.now();
          const timeSinceLastEnter = now - lastEnterTimeRef.current;
          lastEnterTimeRef.current = now;

          const selectedVar = variantModalProduct.variants[focusedVariantIndex];
          if (selectedVar) {
            addToCartWithVariant(variantModalProduct, selectedVar.name, Number(selectedVar.price));
            setVariantModalProduct(null);
            setFocusedSection('CATALOG');
          }

          // Double Enter: If pressed again within 600ms or if cart already had items, confirm order!
          if (timeSinceLastEnter < 600 && cart.length > 0) {
            setTimeout(() => handleCheckout(), 100);
          }
          return;
        }
      }

      // --- BASKET ITEM CONTROLS ---
      if (focusedSection === 'BASKET' && cart.length > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheckout();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedBasketIndex(prev => Math.min(prev + 1, cart.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedBasketIndex(prev => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          const itemToRemove = cart[focusedBasketIndex];
          if (itemToRemove && itemToRemove.cartItemId) {
            removeFromCart(itemToRemove.cartItemId);
            setFocusedBasketIndex(prev => Math.max(0, prev - 1));
          }
          return;
        }
        if (e.key === ' ' || e.key === '+' || e.key === '=') {
          e.preventDefault();
          const itemToInc = cart[focusedBasketIndex];
          if (itemToInc && itemToInc.cartItemId) {
            updateQuantity(itemToInc.cartItemId, 1);
          }
          return;
        }
        if (e.key === 'Backspace' || e.key === '-') {
          e.preventDefault();
          const itemToDec = cart[focusedBasketIndex];
          if (itemToDec && itemToDec.cartItemId) {
            updateQuantity(itemToDec.cartItemId, -1);
          }
          return;
        }
      }

      // --- CATALOG PRODUCT CARDS GRID CONTROLS ---
      if (focusedSection === 'CATALOG' && filteredProducts.length > 0) {
        const cols = 3;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFocusedProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFocusedProductIndex(prev => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedProductIndex(prev => Math.min(prev + cols, filteredProducts.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedProductIndex(prev => Math.max(prev - cols, 0));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const now = Date.now();
          const timeSinceLastEnter = now - lastEnterTimeRef.current;
          lastEnterTimeRef.current = now;

          // Double Enter: If Enter is pressed twice in succession (<600ms) and cart has items, immediately confirm order!
          if (timeSinceLastEnter < 600 && cart.length > 0 && !variantModalProduct) {
            handleCheckout();
            return;
          }

          const product = filteredProducts[focusedProductIndex];
          if (product && product.is_available) {
            handleAddToBasketClick(product);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedSection,
    focusedProductIndex,
    focusedBasketIndex,
    focusedVariantIndex,
    filteredProducts,
    variantModalProduct,
    cart,
    showHelpModal,
    isSearchFocused,
    searchQuery,
    orderType,
    tableNumber,
    takeawayMode,
    customerName,
    customerNotes,
    deliveryAddress,
    customerPhone,
    selectedWaiterId,
    selectedRiderId
  ]);

  const renderBasket = (isMobileOrDrawer = false) => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Basket Header */}
        <div className="flex items-center justify-between border-b border-slate-150 pb-4 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              <h3 className="font-display text-base font-extrabold text-slate-800">🛒 Current Order</h3>
            </div>
            {cart.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {cart.reduce((sum, ci) => sum + ci.quantity, 0)} Items &bull; Ready for Checkout
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                Clear Basket
              </button>
            )}
            {isMobileOrDrawer && (
              <button
                onClick={() => setIsCartMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Core */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4 px-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 shadow-inner">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-slate-700">Your basket is empty</h4>
                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                  Select menu items to begin a new order.
                </p>
              </div>
              <button
                id="btn-browse-menu"
                onClick={() => {
                  if (isMobileOrDrawer) {
                    setIsCartMobileOpen(false);
                  }
                  document.getElementById('pos-terminal-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl border border-orange-500 bg-white hover:bg-orange-50 text-orange-500 px-5 py-2.5 text-xs font-bold transition duration-150 shadow-xs cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {cart.map((ci, cartIdx) => {
                    const isBasketItemFocused = focusedSection === 'BASKET' && cartIdx === focusedBasketIndex;
                    return (
                      <motion.div
                        key={`cart-row-${ci.cartItemId || ci.menuItem.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`rounded-xl border p-4 transition duration-150 flex flex-col gap-3 ${
                          isBasketItemFocused 
                            ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50/60 shadow-md' 
                            : 'border-slate-150 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {isBasketItemFocused && (
                          <div className="flex items-center justify-between bg-orange-500 text-white px-2.5 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase">
                            <span>⌨️ Active Basket Selection</span>
                            <span>[ Space: + | Backspace: - | Del: Remove ]</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-display text-[20px] font-semibold text-slate-800 tracking-tight leading-snug truncate">
                              {ci.menuItem.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {ci.variantName && (
                                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-orange-600 border border-orange-100">
                                  {ci.variantName}
                                </span>
                              )}
                              <span className="text-[13px] text-slate-400 font-mono">
                                {formatPKR(getItemUnitPrice(ci))} / pc
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-[18px] font-bold text-slate-700">
                            {formatPKR(getItemUnitPrice(ci) * ci.quantity)}
                          </span>
                        </div>

                        {/* Quantity Controls & Delete */}
                        <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-100 pt-3">
                          <div className="text-[11px] font-medium text-slate-400">
                            {ci.variantName ? `Size: ${ci.variantName}` : 'Standard Portion'}
                          </div>

                          {/* Controls & Delete */}
                          <div className="flex items-center gap-2">
                            <div className="flex h-[36px] items-center rounded-full bg-slate-50 border border-slate-200/60 p-1">
                              <button
                                type="button"
                                onClick={() => ci.cartItemId && updateQuantity(ci.cartItemId, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-mono text-xs font-bold text-slate-800 px-2 min-w-[20px] text-center">
                                {ci.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => ci.cartItemId && updateQuantity(ci.cartItemId, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => ci.cartItemId && removeFromCart(ci.cartItemId)}
                              className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Remove Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Fulfillment Segmented Control */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block">Fulfillment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('Dine-In')}
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'Dine-In' 
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coffee className="h-4 w-4" /> Dine-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Takeaway')}
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'Takeaway' 
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Package className="h-4 w-4" /> Takeaway
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Delivery')}
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'Delivery' 
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="h-4 w-4" /> Delivery
                  </button>
                </div>
              </div>

              {/* Dynamic Dropdowns & Inputs */}
              <div className="space-y-3">
                {orderType === 'Dine-In' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Table Number <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(Number(e.target.value))}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 font-bold outline-none focus:border-orange-500 focus:bg-white transition cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20].map(n => <option key={n} value={n}>Table #{n}</option>)}
                      </select>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                        Staff Assignment (Waiter)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setAssignmentMode('AUTO'); setSelectedWaiterId(undefined); }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            assignmentMode === 'AUTO' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⚡ Auto Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => { 
                            setAssignmentMode('MANUAL'); 
                            if (availableWaiters.length > 0 && !selectedWaiterId) setSelectedWaiterId(availableWaiters[0].id);
                          }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            assignmentMode === 'MANUAL' 
                              ? 'bg-orange-500 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          👤 Manual Assign
                        </button>
                      </div>

                      {assignmentMode === 'MANUAL' && (
                        <div className="pt-1 animate-in fade-in duration-150">
                          <select
                            value={selectedWaiterId || ''}
                            onChange={(e) => setSelectedWaiterId(Number(e.target.value))}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="">-- Select Waiter --</option>
                            {activeWaitersList.map(w => (
                              <option key={w.id} value={w.id}>{w.full_name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {orderType === 'Takeaway' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Pickup Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={takeawayMode}
                        onChange={(e) => setTakeawayMode(e.target.value as TakeawayMode)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition cursor-pointer"
                      >
                        <option value="Counter">Counter Pickup</option>
                        <option value="Car">Car Pickup (Requires Server Staff)</option>
                      </select>
                    </div>

                    {takeawayMode === 'Car' && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                        <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                          Car Server Assignment (Waiter)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setAssignmentMode('AUTO'); setSelectedWaiterId(undefined); }}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              assignmentMode === 'AUTO' 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            ⚡ Auto Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => { 
                              setAssignmentMode('MANUAL'); 
                              if (activeWaitersList.length > 0 && !selectedWaiterId) setSelectedWaiterId(activeWaitersList[0].id);
                            }}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              assignmentMode === 'MANUAL' 
                                ? 'bg-orange-500 text-white shadow-xs' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            👤 Manual Assign
                          </button>
                        </div>

                        {assignmentMode === 'MANUAL' && (
                          <div className="pt-1 animate-in fade-in duration-150">
                            <select
                              value={selectedWaiterId || ''}
                              onChange={(e) => setSelectedWaiterId(Number(e.target.value))}
                              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                            >
                              <option value="">-- Select Waiter for Car Pickup --</option>
                              {activeWaitersList.map(w => (
                                <option key={w.id} value={w.id}>{w.full_name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {orderType === 'Delivery' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                        Staff Assignment (Delivery Rider)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setAssignmentMode('AUTO'); setSelectedRiderId(undefined); }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            assignmentMode === 'AUTO' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⚡ Auto Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => { 
                            setAssignmentMode('MANUAL'); 
                            if (activeRidersList.length > 0 && !selectedRiderId) setSelectedRiderId(activeRidersList[0].id);
                          }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            assignmentMode === 'MANUAL' 
                              ? 'bg-orange-500 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          👤 Manual Assign
                        </button>
                      </div>

                      {assignmentMode === 'MANUAL' && (
                        <div className="pt-1 animate-in fade-in duration-150">
                          <select
                            value={selectedRiderId || ''}
                            onChange={(e) => setSelectedRiderId(Number(e.target.value))}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="">-- Select Delivery Rider --</option>
                            {activeRidersList.map(r => (
                              <option key={r.id} value={r.id}>{r.full_name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[13px] font-bold text-slate-500 uppercase block">Delivery Address</label>
                      <input
                        type="text"
                        required
                        placeholder="House, Street, Sector, Area Name..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[13px] font-bold text-slate-500 uppercase block">Phone</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0300-1234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cooking Instructions */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block">Cooking / Delivery Instructions</label>
                <textarea
                  rows={3}
                  placeholder="No onions, extra cheese, less spicy..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-none transition duration-150 resize-none animate-none"
                />
              </div>

              {/* Discount & Payment (Stacked, 16px gap) */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block">Discount Applied</label>
                  <select
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value={0}>0% (No Discount)</option>
                    <option value={5}>5% Discount</option>
                    <option value={10}>10% Standard</option>
                    <option value={15}>15% VIP Promo</option>
                    <option value={20}>20% Staff Disc</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block">Cash Received</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 font-mono text-[11px] text-slate-400 font-bold">PKR</span>
                    <input
                      ref={cashInputRef}
                      type="text"
                      placeholder="Enter Cash Amount (Ctrl+P)"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full h-10 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 font-mono outline-none focus:bg-white focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Premium Receipt Summary */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
                <div className="flex justify-between text-[13px] text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-700">
                    <AnimatedNumber value={cartSubtotal} formatter={formatPKR} />
                  </span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-[13px] text-rose-500">
                    <span>Discount ({discountPercent}%)</span>
                    <span className="font-mono font-medium">
                      -<AnimatedNumber value={discountAmount} formatter={formatPKR} />
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[13px] text-slate-500">
                  <span>GST (16%)</span>
                  <span className="font-mono font-medium text-slate-700">
                    <AnimatedNumber value={taxAmount} formatter={formatPKR} />
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Grand Total</span>
                  <span className="text-[28px] font-bold text-orange-500 font-display leading-none">
                    <AnimatedNumber value={cartTotal} formatter={formatPKR} />
                  </span>
                </div>

                {/* Assigned Operational Staff Badge */}
                <div className="border-t border-slate-200/80 pt-2.5 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span>{assignedStaff.icon}</span>
                    <span>Assigned {assignedStaff.role}</span>
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                    {assignedStaff.name} {assignedStaff.isAuto ? '(Auto)' : ''}
                  </span>
                </div>
              </div>

              {/* Change Due (Large Green Typography) */}
              {cashNum > 0 && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100/80 p-5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[13px] text-emerald-700">
                    <span>Cash Received</span>
                    <span className="font-mono font-bold">{formatPKR(cashNum)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-emerald-200/60 pt-2.5">
                    <span className="text-[13px] font-bold text-emerald-800">Change Due</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                      {formatPKR(changeDue)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Checkout Footer Container */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-slate-100 bg-white shrink-0">
            <button
              onClick={handleCheckout}
              className="w-full flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-sm font-bold text-white shadow-md shadow-orange-100 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Receipt className="h-5 w-5" />
              <span>Confirm Order &amp; Print Receipt</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="pos-terminal-grid" className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Product Grid Area (Left 2 columns on desktop) */}
      <div className="flex-1 space-y-5 w-full">
        {/* Search & Category Filter Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-800">Checkout Catalog</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">Search and tap dishes to build order</span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-2.5 py-1 font-mono text-[10px] font-bold">
                  <span>⌨️ Nav: [↑ ↓ ← →]</span>
                  <span>&bull;</span>
                  <span>[Enter] Add</span>
                  <span>&bull;</span>
                  <span>[Ctrl+F] Search</span>
                  <span>&bull;</span>
                  <button 
                    type="button"
                    onClick={() => setShowHelpModal(true)} 
                    className="underline text-orange-400 hover:text-orange-300 cursor-pointer ml-1"
                  >
                    F1 Shortcuts Help
                  </button>
                </span>
              </div>
            </div>
            {/* Search Box */}
            <div className="relative max-w-xs">
              <span className={`absolute inset-y-0 left-2.5 flex items-center text-slate-400 transition-all duration-200 ${isSearchFocused ? 'translate-x-1 text-orange-500' : ''}`}>
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Quick catalog search... (Ctrl+F)"
                value={searchQuery}
                onFocus={() => { setIsSearchFocused(true); setFocusedSection('SEARCH'); }}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:shadow-[0_0_8px_rgba(249,115,22,0.15)] transition-all duration-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto gap-1.5 pb-1">
            <button
              onClick={() => setSelectedStaffCategory('All')}
              className={`rounded-xl px-4 py-2 font-display text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                selectedCategory === 'All'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-[1.01]'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={`tab-cat-${cat.id}`}
                onClick={() => setSelectedStaffCategory(cat.id)}
                className={`rounded-xl px-4 py-2 font-display text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-[1.01]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Products Grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredProducts.map((product, idx) => {
              const isJustClicked = clickedItemId === product.id;
              const hasRipple = rippleCardId === product.id;
              const isKeyboardFocused = focusedSection === 'CATALOG' && idx === focusedProductIndex;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.02, ease: "easeOut" }}
                  key={`prod-card-${product.id}`}
                  onClick={() => product.is_available && handleAddToBasketClick(product)}
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 ease-out cursor-pointer ${
                    isKeyboardFocused 
                      ? 'border-orange-500 ring-2 ring-orange-500 shadow-xl scale-[1.02] bg-orange-50/20' 
                      : 'border-slate-200 hover:-translate-y-[6px]'
                  }`}
                >
                  {hasRipple && (
                    <span className="absolute inset-0 bg-orange-400/25 rounded-2xl animate-ping pointer-events-none z-10" style={{ animationDuration: '0.4s' }} />
                  )}
                  
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                    {!product.is_available && (
                      <span className="absolute top-2 right-2 rounded-md bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase shadow-xs">
                        Out of Stock
                      </span>
                    )}
                    {isKeyboardFocused && (
                      <span className="absolute top-2 left-2 rounded-md bg-orange-500 px-2 py-0.5 font-mono text-[9px] font-black text-white uppercase shadow-md animate-pulse">
                        ⌨️ Active Selection
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/70 px-2 py-0.5 font-mono text-[10px] font-bold text-white transition-transform duration-200 ease-out group-hover:-translate-y-1">
                      {formatPKR(product.price)}
                    </span>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display text-xs font-bold text-slate-800 transition-colors duration-200 group-hover:text-orange-600">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToBasketClick(product); }}
                      disabled={!product.is_available}
                      className={`w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 font-display text-[10px] font-bold text-white transition-all duration-200 active:scale-95 cursor-pointer hover:shadow-md ${
                        isJustClicked 
                          ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' 
                          : isKeyboardFocused
                          ? 'bg-orange-600 shadow-md ring-2 ring-orange-400'
                          : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100 group-hover:-translate-y-[2px]'
                      } disabled:opacity-50`}
                    >
                      {isJustClicked ? (
                        <>
                          <CheckSquare className="h-3 w-3 animate-bounce" /> Added!
                        </>
                      ) : isKeyboardFocused ? (
                        <>
                          <Plus className="h-3 w-3" /> Press Enter (↵) to Add
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Add To Basket
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>

      {/* Checkout Sidebar Panel (Right column on desktop/laptop) */}
      <div className="hidden lg:block lg:w-[420px] xl:w-[460px] shrink-0 sticky top-4 max-h-[calc(100vh-6rem)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm h-[calc(100vh-6rem)]">
          {renderBasket()}
        </div>
      </div>

      {/* Floating Cart Button for Mobile/Tablet */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          id="mobile-cart-trigger"
          onClick={() => setIsCartMobileOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl hover:bg-orange-600 transition duration-150 active:scale-95 cursor-pointer"
        >
          <ShoppingBag className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white ring-2 ring-white">
              {cart.reduce((sum, ci) => sum + ci.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile/Tablet Slide-over Drawer Backdrop */}
      {/* Mobile/Tablet Slide-over Drawer Backdrop */}
      {isCartMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          {/* Slide-over Drawer container */}
          <div className="w-full sm:max-w-md md:max-w-lg bg-white h-full shadow-2xl flex flex-col p-8 gap-6 animate-in slide-in-from-right duration-200">
            {renderBasket(true)}
          </div>
        </div>
      )}

      {/* Size / Variant Selection Modal */}
      <AnimatePresence>
        {variantModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-800">
                    Select Portion &amp; Size
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{variantModalProduct.name}</p>
                </div>
                <button
                  onClick={() => setVariantModalProduct(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 py-2">
                {variantModalProduct.variants?.map((v: any, vIdx: number) => {
                  const isVarFocused = vIdx === focusedVariantIndex;
                  return (
                    <button
                      key={`var-opt-${v.id || v.name}`}
                      onClick={() => {
                        addToCartWithVariant(variantModalProduct, v.name, Number(v.price));
                        setVariantModalProduct(null);
                        setFocusedSection('CATALOG');
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition duration-150 cursor-pointer group ${
                        isVarFocused 
                          ? 'border-orange-500 bg-orange-50/90 ring-2 ring-orange-500/40 shadow-sm' 
                          : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-orange-600">
                          {v.name}
                        </span>
                        {v.isDefault && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                            Default
                          </span>
                        )}
                        {isVarFocused && (
                          <span className="rounded-full bg-orange-500 text-white px-2 py-0.5 font-mono text-[9px] font-bold">
                            ↵ Enter
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-black text-orange-500 text-sm">
                        {formatPKR(Number(v.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Dialog Overlay (F1) */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 text-white p-6 shadow-2xl space-y-5 border border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white font-mono font-bold text-sm">
                    ⌨️
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-black tracking-wide text-white">
                      Enterprise POS Hotkeys &amp; Keyboard Controls
                    </h3>
                    <p className="text-xs text-slate-400">Toast POS, Micros &amp; Square Keyboard Navigation Guide</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <span className="font-bold text-orange-400 uppercase tracking-wider block text-[10px]">Catalog &amp; Navigation</span>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Move Grid Selection</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-orange-300">↑ ↓ ← →</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Add Item / Pick Size</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-emerald-300">Enter ↵</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Focus Product Search</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-blue-300">Ctrl + F</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Cycle Interface Areas</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-slate-300">Tab / Shift+Tab</kbd></div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <span className="font-bold text-orange-400 uppercase tracking-wider block text-[10px]">Order &amp; Payment Actions</span>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Focus Basket Items</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-amber-300">Ctrl + B</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Focus Payment (Cash)</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-amber-300">Ctrl + P</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Submit &amp; Print Order</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-emerald-400">Ctrl + S</kbd></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Create New Order</span><kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-rose-300">Ctrl + N</kbd></div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2 sm:col-span-2">
                  <span className="font-bold text-orange-400 uppercase tracking-wider block text-[10px]">Basket Item Editing (When Ctrl+B active)</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="flex justify-between items-center"><span className="text-slate-300">Increase Qty</span><kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-white">Space / +</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-slate-300">Decrease Qty</span><kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-white">Backspace / -</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-slate-300">Remove Item</span><kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-rose-400">Delete</kbd></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <span className="text-[10px] text-slate-500">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">F1</kbd> to close</span>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white shadow-md cursor-pointer transition"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
