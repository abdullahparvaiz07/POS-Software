/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, OrderItem, User } from '../../types';
import { formatPKR } from './StatisticsCards';
import { X, Printer, Calendar, Clock, MapPin, CreditCard, ShoppingBag, UserCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { motion } from 'motion/react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const Modals: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { orderItems, users, systemSettings } = useDashboard();
  const hasPrintedRef = React.useRef(false);

  // Keyboard navigation for Receipt Modal (3rd Enter prints receipt, 4th Enter or Esc closes modal)
  React.useEffect(() => {
    if (!order) return;
    
    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!hasPrintedRef.current) {
          hasPrintedRef.current = true;
          window.print();
        } else {
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const settings = systemSettings || {
    restaurantName: 'Restaurant POS',
    slogan: 'Fast & Fresh Dining',
    logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=150&auto=format&fit=crop&q=60',
    phone: '+92 300 1234567',
    email: 'info@restaurant.com',
    website: 'www.restaurant.com',
    address: 'Main Boulevard, Gulberg III',
    city: 'Lahore',
    country: 'Pakistan',
    receiptHeader: 'Welcome to our Restaurant! Enjoy your meal.',
    receiptFooter: 'Thank you for dining with us! Please visit again.',
    taxPercentage: 16,
    serviceCharge: 5,
  };

  // Find items belonging to this order
  const currentOrderItems = orderItems.filter(item => item.order_id === order.id);

  // Find staff assigned
  const assignedStaffMember = users.find(s => s.id === order.assigned_staff_id);

  // Calculate tax and totals
  const hasSubtotalField = 'subtotal' in order;
  const subtotal = hasSubtotalField ? (order as any).subtotal : order.total_amount / 1.16;
  const taxAmount = hasSubtotalField ? (order as any).tax : order.total_amount - subtotal;
  
  // Calculate service charges - if has subtotal field and service_charges is set, use it. Otherwise, if enabled in settings, use 5% of subtotal.
  const serviceCharges = hasSubtotalField 
    ? ((order as any).service_charges || 0) 
    : (settings.enableServiceCharges ? subtotal * 0.05 : 0);

  const discount = hasSubtotalField ? ((order as any).discount || 0) : 0;
  const totalAmount = order.total_amount;

  // Calculate Cash Received and Change Returned dynamically
  const getCashDetails = (total: number) => {
    if (total <= 0) return { received: 0, change: 0 };
    let received = total;
    if (total <= 100) received = 100;
    else if (total <= 500) received = 500;
    else if (total <= 1000) received = 1000;
    else {
      received = Math.ceil(total / 500) * 500;
      if (received === total) {
        received += 500;
      }
    }
    return {
      received,
      change: received - total
    };
  };

  const cashDetails = getCashDetails(totalAmount);

  // Format date
  const formatDateString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatTimeString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      id="modal-backdrop-receipt" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        id="modal-container-receipt" 
        className="relative flex w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <div>
            <h3 className="font-display text-base font-extrabold text-slate-800">Order &amp; Receipt Overview</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Details for transaction {order.order_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                hasPrintedRef.current = true;
                window.print();
              }}
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Thermal Slip [Press Enter ↵]</span>
            </button>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Metadata on left, Authentic Thermal Slip on right) */}
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Metadata & Actions */}
          <div className="space-y-4">
            <div className="space-y-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Properties</span>
              
              {/* Type Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 flex items-start gap-2.5">
                <ShoppingBag className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Fulfillment Type</p>
                  <p className="text-slate-500 mt-0.5">{order.order_type} {order.takeaway_mode ? `(${order.takeaway_mode} Pickup)` : ''}</p>
                  {order.table_number && <p className="text-orange-600 font-semibold mt-0.5">Table Assignment: {order.table_number}</p>}
                </div>
              </div>

              {/* Staff Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 flex items-start gap-2.5">
                <UserCheck className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">
                    {order.order_type === 'Dine-In' ? 'Assigned Waiter' : (order.order_type === 'Delivery' ? 'Assigned Delivery Rider' : 'Service Staff')}
                  </p>
                  <p className="text-slate-800 font-extrabold mt-0.5">
                    {order.waiter_name || order.delivery_rider_name || (assignedStaffMember ? `${assignedStaffMember.full_name} (${order.assigned_role})` : 'Unassigned / Counter')}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-md font-bold uppercase">
                      {order.assignment_method || 'AUTO'}
                    </span>
                    {order.assigned_by_name && (
                      <span>Assigned by {order.assigned_by_name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payments Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 flex items-start gap-2.5">
                <CreditCard className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Bill Summary</p>
                  <p className="text-slate-500 mt-0.5">Payment State: <span className="font-bold">{order.payment_status}</span></p>
                  <p className="text-slate-500">Order Status: <span className="font-bold">{order.status}</span></p>
                </div>
              </div>
            </div>

            {/* Visual Order & Staff Assignment History Timeline */}
            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 animate-in fade-in duration-150">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">Order & Staff Assignment Audit History</span>
              
              <div className="relative pl-5 mt-2.5 space-y-4 text-xs">
                {/* Vertical timeline line */}
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-slate-200" />

                {/* Node 1: Staff Assignment Log */}
                {(order.waiter_name || order.delivery_rider_name || order.assigned_staff_id) && (
                  <div className="relative">
                    <span className="absolute -left-[18.5px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 ring-4 ring-white" />
                    <div className="font-semibold text-slate-800 leading-tight">
                      {order.assigned_by_name || 'Cashier'} assigned {order.order_type === 'Dine-In' ? 'Waiter' : 'Rider'} <span className="text-orange-600 font-bold">{order.waiter_name || order.delivery_rider_name || 'Staff'}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">
                      {formatTimeString(order.assigned_at || order.created_at)} • {order.assignment_method || 'AUTO'} Assignment
                    </div>
                  </div>
                )}

                {/* Node 2: Placed */}
                <div className="relative">
                  <span className="absolute -left-[18.5px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white" />
                  <div className="font-semibold text-slate-800 leading-tight">Order Placed & Logged</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">{formatTimeString(order.created_at)} • POS Terminal</div>
                </div>

                {/* Node 3: Prep */}
                <div className="relative">
                  <span className={`absolute -left-[18.5px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white transition-all ${
                    order.status !== 'Pending' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <div className="font-semibold text-slate-800 leading-tight">
                    {order.status === 'Pending' ? 'Awaiting Kitchen Dispatch' : (order.status === 'Preparing' ? 'Kitchen Accepted & Cooking' : 'Kitchen Ready')}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    {order.status === 'Pending' ? 'Pending preparation' : 
                     (order.status === 'Preparing' ? 'Chef preparing items' : 'Items ready for table/rider')}
                  </div>
                </div>

                {/* Node 4: Payment / Completed */}
                <div className="relative">
                  <span className={`absolute -left-[18.5px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white transition-all ${
                    order.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <div className="font-semibold text-slate-800 leading-tight font-display">
                    {order.payment_status === 'Paid' ? 'Payment Completed' : 'Payment Pending'}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    {order.payment_status === 'Paid' ? `Billed ${formatPKR(order.total_amount)} via Cash/Card` : 'Awaiting payment collection'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section if any */}
            {order.customer_notes && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5">
                <span className="font-display text-[9px] font-bold uppercase tracking-wider text-amber-600">Customer Instructions</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">
                  "{order.customer_notes}"
                </p>
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="pt-2">
              <button
                id="btn-print-receipt"
                onClick={() => {
                  window.print();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 font-display text-xs font-bold text-white shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-98 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Receipt (PDF)
              </button>
            </div>
          </div>

          {/* Right Column: Thermal Slip Simulation (Redesigned) */}
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 shadow-inner flex justify-center overflow-x-auto">
            <div 
              id="receipt-print-area" 
              className="w-[300px] bg-amber-50/40 p-5 font-mono text-[11px] text-slate-850 leading-tight border border-slate-200 rounded-sm shadow-md print:shadow-none print:border-none print:w-[80mm] print:p-0 print:bg-white print:text-black"
              style={{ contentVisibility: 'auto' }}
            >
              
              {/* Brand Header */}
              <div className="text-center space-y-1">
                {/* Center Logo */}
                {settings.showLogoOnReceipt && settings.logo && (
                  <div className="flex justify-center mb-1">
                    <img 
                      src={settings.logo} 
                      alt="Logo" 
                      className="h-10 w-10 rounded-full object-cover grayscale contrast-200 border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <p className="font-black text-xs uppercase tracking-tight text-slate-900 print:text-black">{settings.restaurantName || 'Restaurant POS'}</p>
                {settings.slogan && <p className="text-[9px] text-slate-550 italic print:text-slate-700">{settings.slogan}</p>}
                <p className="text-[9px] text-slate-550 print:text-slate-700">{settings.address || 'Address Line'}{settings.city ? `, ${settings.city}` : ''}</p>
                <p className="text-[9px] text-slate-550 print:text-slate-700">Ph: {settings.phone || '000-000-0000'}</p>
                {settings.ntn && <p className="text-[9px] font-bold text-slate-650 print:text-black">NTN: {settings.ntn}</p>}
              </div>

              {settings.receiptHeader && (
                <>
                  <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />
                  <p className="text-center text-[9px] italic text-slate-600 print:text-slate-700 whitespace-pre-line">"{settings.receiptHeader}"</p>
                </>
              )}

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* Receipt Information Table */}
              <div className="grid grid-cols-[80px_1fr] gap-x-1 text-[9.5px] leading-tight font-mono text-slate-700 print:text-black">
                <span>Invoice No:</span>
                <span className="font-bold">{order.order_number}</span>
                
                <span>Date:</span>
                <span>{formatDateString(order.created_at)}</span>
                
                <span>Time:</span>
                <span>{formatTimeString(order.created_at)}</span>
                
                <span>Cashier:</span>
                <span>{order.assigned_by_name || 'Cashier'}</span>
                
                <span>Order Type:</span>
                <span className="font-bold">{order.order_type} {order.takeaway_mode ? `(${order.takeaway_mode})` : ''}</span>
                
                <span>Payment:</span>
                <span>{order.payment_method || 'CASH'}</span>
                
                {order.table_number && (
                  <>
                    <span>Table:</span>
                    <span className="font-bold">{order.table_number.toString().padStart(2, '0')}</span>
                  </>
                )}

                {(order.order_type === 'Dine-In' || (order.order_type === 'Takeaway' && order.takeaway_mode === 'Car')) && (
                  <>
                    <span>Waiter:</span>
                    <span>{order.waiter_name || assignedStaffMember?.full_name || 'Waitstaff'}</span>
                  </>
                )}

                {order.order_type === 'Delivery' && (
                  <>
                    <span>Rider:</span>
                    <span>{order.delivery_rider_name || assignedStaffMember?.full_name || 'Delivery Rider'}</span>
                  </>
                )}
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* Items Table */}
              <div className="w-full text-[10px] text-slate-800 print:text-black">
                <div className="grid grid-cols-[30px_1fr_75px] font-bold pb-1 border-b border-dashed border-slate-400 print:border-black text-[10px]">
                  <span>Qty</span>
                  <span>Item</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="py-1.5 space-y-1.5">
                  {currentOrderItems.map((item) => (
                    <div key={`receipt-item-${item.id}`} className="space-y-0.5">
                      <div className="grid grid-cols-[30px_1fr_75px] items-start">
                        <span>{item.quantity}x</span>
                        <span className="uppercase">{item.menu_item_name} {item.variantName ? `(${item.variantName})` : ''}</span>
                        <span className="text-right">{formatPKR(item.subtotal, settings.currencySymbol)}</span>
                      </div>
                      {item.notes && item.notes.split(',').map((note, idx) => (
                        <div key={idx} className="pl-[30px] text-[8.5px] text-slate-500 italic print:text-slate-600">
                          • {note.trim()}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* Order Summary Section */}
              <div className="space-y-1 text-[10.5px] text-slate-800 print:text-black">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPKR(subtotal, settings.currencySymbol)}</span>
                </div>
                {Number(settings.taxPercentage) > 0 && (
                  <div className="flex justify-between">
                    <span>Sales Tax ({settings.taxPercentage}%):</span>
                    <span>{formatPKR(taxAmount, settings.currencySymbol)}</span>
                  </div>
                )}
                {serviceCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge ({settings.serviceCharge || 5}%):</span>
                    <span>{formatPKR(serviceCharges, settings.currencySymbol)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 print:text-black">
                    <span>Discount:</span>
                    <span>-{formatPKR(discount, settings.currencySymbol)}</span>
                  </div>
                )}
                
                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-400 my-1 print:border-black" />
                
                <div className="flex justify-between text-[13px] font-black text-slate-900 print:text-black pt-0.5">
                  <span>TOTAL:</span>
                  <span>{formatPKR(totalAmount, settings.currencySymbol)}</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* Payment Section */}
              <div className="space-y-1 text-[10px] text-slate-700 print:text-black leading-tight">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="uppercase font-bold">{order.payment_method || 'CASH'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Received:</span>
                  <span>{formatPKR(cashDetails.received, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Returned:</span>
                  <span>{formatPKR(cashDetails.change, settings.currencySymbol)}</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* QR Code Section */}
              <div className="text-center space-y-1 py-1">
                <div className="flex justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://bubblepos.pk/verify?id=' + order.order_number)}`} 
                    alt="QR Code" 
                    className="w-20 h-20 grayscale"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[9px] text-slate-400 italic print:text-slate-500">
                  Scan to verify receipt
                </p>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-slate-400 my-2 print:border-black" />

              {/* Centered Footer */}
              <div className="text-center text-[10px] leading-relaxed space-y-0.5 text-slate-800 print:text-black">
                {settings.receiptFooter ? (
                  <p className="text-slate-700 print:text-black font-bold whitespace-pre-line">{settings.receiptFooter}</p>
                ) : (
                  <>
                    <p className="font-bold text-[11px] text-slate-900 print:text-black">THANK YOU!</p>
                    <p className="text-slate-600">Please visit again soon.</p>
                  </>
                )}
                
                <p className="text-[9px] text-slate-400 mt-1">Powered by {settings.restaurantName || 'Restaurant POS'}</p>
                <div className="flex justify-center pt-1 print:hidden">
                  <div className="h-5 w-40 bg-slate-800/80 rounded-xs flex items-center justify-center text-[7px] text-white tracking-widest font-mono">
                    ||||| | |||| ||| ||||| ||
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
