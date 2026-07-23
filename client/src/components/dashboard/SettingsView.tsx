/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Save, 
  Store, 
  Image as ImageIcon, 
  DollarSign, 
  Receipt as ReceiptIcon, 
  ShieldCheck, 
  Printer, 
  ChefHat, 
  Flame, 
  Coffee, 
  Crown, 
  Utensils, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Phone,
  Mail,
  MapPin,
  Percent,
  FileText,
  Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { useDashboard } from '../../context/DashboardContext';

const PRESET_LOGOS = [
  { name: 'Chef Hat', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80', icon: ChefHat },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80', icon: Utensils },
  { name: 'Artisan Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80', icon: Coffee },
  { name: 'Flame Grill', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80', icon: Flame },
  { name: 'Royal Bistro', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80', icon: Crown }
];

export const SettingsView: React.FC = () => {
  const { addNotification, refreshSettings, updateSystemSettings } = useDashboard();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<'general' | 'branding' | 'finance' | 'receipt' | 'inventory'>('general');

  const [formData, setFormData] = useState<any>({
    restaurantName: 'Gourmet Haven',
    slogan: 'Taste the Distinction',
    logo: '',
    phone: '+92 300 8452132',
    email: 'contact@gourmethaven.com',
    website: 'www.gourmethaven.com',
    address: 'Plot 42-C, M.M. Alam Road, Gulberg III',
    city: 'Lahore',
    country: 'Pakistan',
    currency: 'PKR',
    currencySymbol: 'PKR',
    taxPercentage: 16,
    serviceCharge: 5,
    ntn: '7482910-3',
    receiptHeader: 'Welcome to Gourmet Haven! We prepare food with love.',
    receiptFooter: 'Thank you for dining with us! Please visit again soon.',
    orderPrefix: 'ORD',
    allowNegativeInventory: false,
    showLogoOnReceipt: true,
    printTax: true
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings
  });

  useEffect(() => {
    if (settings) {
      setFormData((prev: any) => ({
        ...prev,
        ...settings,
        taxPercentage: Number(settings.taxPercentage || 0),
        serviceCharge: Number(settings.serviceCharge || 0)
      }));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsService.updateSettings(data),
    onSuccess: async () => {
      addNotification('success', 'Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      await refreshSettings();
    },
    onError: (error: any) => {
      addNotification('error', `Failed to update settings: ${error.message}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setFormData((prev: any) => {
      const nextData = { ...prev, [name]: val };
      if (name === 'restaurantName' || name === 'logo') {
        updateSystemSettings({ [name]: val });
      }
      return nextData;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification('warning', 'File size exceeds 2MB limit. Please choose a smaller logo image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setFormData((prev: any) => ({ ...prev, logo: base64Url }));
        updateSystemSettings({ logo: base64Url });
        addNotification('info', 'Logo image loaded from PC. Click "Save All Settings" to apply changes.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggle = (key: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const sampleSubtotal = 1450;
  const taxAmount = (sampleSubtotal * (Number(formData.taxPercentage) || 0)) / 100;
  const serviceAmount = (sampleSubtotal * (Number(formData.serviceCharge) || 0)) / 100;
  const sampleGrandTotal = sampleSubtotal + taxAmount + serviceAmount;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-semibold text-sm animate-pulse">Loading System Settings...</div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-500" />
            System & Brand Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure restaurant identity, white-label branding, currency, taxes & thermal receipt preview</p>
        </div>

        {/* Sticky Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Saving Settings...' : 'Save All Settings'}
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: 'general', label: 'Store Identity', icon: Store },
          { id: 'branding', label: 'Logo & Theme', icon: ImageIcon },
          { id: 'finance', label: 'Currency & Tax', icon: DollarSign },
          { id: 'receipt', label: 'Thermal Receipt', icon: ReceiptIcon },
          { id: 'inventory', label: 'Operations & Stock', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={`set-tab-${tab.id}`}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid Layout: Settings Form (Left) vs Live Receipt Preview (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Form Section */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            
            {/* 1. STORE IDENTITY SECTION */}
            {activeSection === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Restaurant Identity & Contact
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Restaurant Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName || ''}
                    onChange={handleChange}
                    placeholder="e.g. Gourmet Haven POS"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                    required
                  />
                  <p className="text-[10px] text-slate-400">This updates the top navbar, left logo brand banner, and printed receipt header.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Tagline / Slogan</label>
                  <input
                    type="text"
                    name="slogan"
                    value={formData.slogan || ''}
                    onChange={handleChange}
                    placeholder="e.g. Taste the Distinction"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="info@restaurant.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Physical Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="Main Street / Commercial Area"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      placeholder="Lahore"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      placeholder="Pakistan"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. LOGO & BRANDING SECTION */}
            {activeSection === 'branding' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Logo & Visual Customization
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Custom Logo Image URL</label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400">Paste direct PNG or JPG image link to display your brand logo in navbar and thermal receipt.</p>
                </div>

                {/* Upload from PC option */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Upload Logo File from Computer (.png, .jpg, .svg, .webp)
                  </label>
                  <label className="flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-3.5 text-xs font-bold text-orange-700 hover:bg-orange-100/60 hover:border-orange-400 transition cursor-pointer shadow-xs">
                    <Upload className="h-4.5 w-4.5 text-orange-600" />
                    <span>Choose Logo Image from PC...</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">Select an image file from your computer. It will automatically convert and load into navbar and receipts.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Or Select Preset Logo Sample
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_LOGOS.map((preset, idx) => {
                      const Icon = preset.icon;
                      const isSelected = formData.logo === preset.url;
                      return (
                        <button
                          key={`preset-logo-${idx}`}
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({ ...prev, logo: preset.url }));
                            updateSystemSettings({ logo: preset.url });
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-200' 
                              : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <span className="text-[9px] font-bold truncate w-full text-center">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.logo && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={formData.logo} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-slate-300" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Logo Active</p>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormData((prev: any) => ({ ...prev, logo: '' }));
                          updateSystemSettings({ logo: '' });
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. CURRENCY & TAX SECTION */}
            {activeSection === 'finance' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Currency & Sales Tax Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Currency Code</label>
                    <select
                      name="currency"
                      value={formData.currency || 'PKR'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const symbolMap: Record<string, string> = { PKR: 'PKR', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SAR: 'SAR' };
                        setFormData((prev: any) => ({ ...prev, currency: val, currencySymbol: symbolMap[val] || val }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="PKR">PKR - Pakistani Rupee</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="SAR">SAR - Saudi Riyal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Currency Symbol</label>
                    <input
                      type="text"
                      name="currencySymbol"
                      value={formData.currencySymbol || 'PKR'}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">POS Sales Tax (%)</label>
                    <input
                      type="number"
                      name="taxPercentage"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxPercentage ?? 16}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Service Charge (%)</label>
                    <input
                      type="number"
                      name="serviceCharge"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.serviceCharge ?? 0}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">NTN / Tax Registration Number</label>
                  <input
                    type="text"
                    name="ntn"
                    value={formData.ntn || ''}
                    onChange={handleChange}
                    placeholder="e.g. 1234567-8"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. RECEIPT CUSTOMIZATION SECTION */}
            {activeSection === 'receipt' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Thermal Receipt Customization
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Order Number Prefix</label>
                  <input
                    type="text"
                    name="orderPrefix"
                    value={formData.orderPrefix || 'ORD'}
                    onChange={handleChange}
                    placeholder="e.g. ORD"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Receipt Welcome Header Note</label>
                  <textarea
                    rows={2}
                    name="receiptHeader"
                    value={formData.receiptHeader || ''}
                    onChange={handleChange}
                    placeholder="e.g. Welcome to our Restaurant! Food served fresh."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Receipt Thank You Footer Note</label>
                  <textarea
                    rows={2}
                    name="receiptFooter"
                    value={formData.receiptFooter || ''}
                    onChange={handleChange}
                    placeholder="e.g. Thank you for dining with us! Please visit again."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Show Logo on Printed Receipt</h4>
                    <p className="text-[10px] text-slate-400">Print brand image on 80mm thermal receipts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('showLogoOnReceipt')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      formData.showLogoOnReceipt ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.showLogoOnReceipt ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* 5. OPERATIONS & INVENTORY SECTION */}
            {activeSection === 'inventory' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Inventory & Store Policy Rules
                </h3>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Allow Negative Inventory</h4>
                    <p className="text-[10px] text-slate-400">Allow cashiers to process orders even if ingredient stock is zero</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('allowNegativeInventory')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      formData.allowNegativeInventory ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.allowNegativeInventory ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Staff Auto-Assignment Rules</h4>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Enable Auto Waiter Assignment</h4>
                      <p className="text-[10px] text-slate-400">Automatically assign active Waiters to new Dine-In orders via Round Robin</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('enableAutoWaiterAssignment')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        formData.enableAutoWaiterAssignment ? 'bg-orange-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.enableAutoWaiterAssignment ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Enable Auto Rider Assignment</h4>
                      <p className="text-[10px] text-slate-400">Automatically assign active Delivery Riders to new Delivery orders via Round Robin</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('enableAutoRiderAssignment')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        formData.enableAutoRiderAssignment ? 'bg-orange-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.enableAutoRiderAssignment ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Auto Assignment Strategy</label>
                    <select
                      name="assignmentStrategy"
                      value={formData.assignmentStrategy || 'ROUND_ROBIN'}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="ROUND_ROBIN">Round Robin (Default V1.0)</option>
                      <option value="LEAST_ACTIVE">Least Active Staff (Future)</option>
                      <option value="NEAREST_RIDER">Nearest Rider (Future)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Saving Settings...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Thermal Receipt Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="h-4 w-4 text-orange-500" />
              Live Thermal Receipt Preview (80mm)
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Realtime Sync
            </span>
          </div>

          {/* Authentic 80mm Thermal Receipt Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-lg flex flex-col items-center">
            {/* Paper Slip Body */}
            <div id="printable-thermal-receipt" className="w-full max-w-[320px] bg-amber-50/40 p-5 text-slate-800 font-mono text-[11px] leading-tight shadow-md border border-slate-200 rounded-sm">
              {/* Receipt Header / Logo */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                {formData.showLogoOnReceipt && (
                  <div className="flex justify-center mb-1">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Receipt Logo" className="h-10 w-10 object-cover rounded-full border border-slate-400" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {(formData.restaurantName || 'R').charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                <p className="font-black text-sm uppercase tracking-tight text-slate-900">{formData.restaurantName || 'Restaurant POS'}</p>
                {formData.slogan && <p className="text-[10px] text-slate-600 italic">{formData.slogan}</p>}
                <p className="text-[10px] text-slate-600">{formData.address || 'Address Line'}{formData.city ? `, ${formData.city}` : ''}</p>
                <p className="text-[10px] text-slate-600">Ph: {formData.phone || '000-000-0000'}</p>
                {formData.ntn && <p className="text-[10px] font-bold text-slate-700">NTN: {formData.ntn}</p>}
              </div>

              {/* Header Note */}
              {formData.receiptHeader && (
                <p className="text-[10px] text-center text-slate-600 mb-3 italic px-2">"{formData.receiptHeader}"</p>
              )}

              {/* Order Info Bar */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between"><span>Order #:</span><span className="font-bold">{formData.orderPrefix || 'ORD'}-8492</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleDateString('en-US')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="flex justify-between"><span>Type:</span><span className="font-bold">Dine-In (Table #4)</span></div>
                <div className="flex justify-between"><span>Cashier:</span><span>Abdullah</span></div>
              </div>

              {/* Line Items Table */}
              <div className="border-b border-dashed border-slate-400 pb-3 mb-3 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold border-b border-slate-300 pb-1">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between">
                  <div className="max-w-[170px]"><span>1. Zinger Burger</span><span className="block text-[9px] text-slate-500">(Medium)</span></div>
                  <span>1x</span>
                  <span>{formData.currencySymbol || 'PKR'} 650</span>
                </div>
                <div className="flex justify-between">
                  <div className="max-w-[170px]"><span>2. Loaded Fries</span></div>
                  <span>1x</span>
                  <span>{formData.currencySymbol || 'PKR'} 450</span>
                </div>
                <div className="flex justify-between">
                  <div className="max-w-[170px]"><span>3. Mint Margarita</span></div>
                  <span>2x</span>
                  <span>{formData.currencySymbol || 'PKR'} 350</span>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3 mb-3">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formData.currencySymbol || 'PKR'} {sampleSubtotal}</span></div>
                {Number(formData.taxPercentage) > 0 && (
                  <div className="flex justify-between"><span>Sales Tax ({formData.taxPercentage}%):</span><span>{formData.currencySymbol || 'PKR'} {taxAmount.toFixed(0)}</span></div>
                )}
                {Number(formData.serviceCharge) > 0 && (
                  <div className="flex justify-between"><span>Service Charge ({formData.serviceCharge}%):</span><span>{formData.currencySymbol || 'PKR'} {serviceAmount.toFixed(0)}</span></div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-400 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{formData.currencySymbol || 'PKR'} {sampleGrandTotal.toFixed(0)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center space-y-1 pt-1">
                {formData.receiptFooter && <p className="text-[10px] text-slate-700 font-bold">{formData.receiptFooter}</p>}
                <p className="text-[9px] text-slate-400">Powered by {formData.restaurantName || 'Restaurant POS'}</p>
                <div className="flex justify-center pt-1">
                  <div className="h-6 w-48 bg-slate-800/80 rounded-xs flex items-center justify-center text-[8px] text-white tracking-widest font-mono">
                    ||||| | |||| ||| ||||| ||
                  </div>
                </div>
              </div>
            </div>

            {/* Print Test Action */}
            <button
              type="button"
              onClick={() => {
                const printContents = document.getElementById('printable-thermal-receipt')?.outerHTML;
                const printWindow = window.open('', '', 'height=500,width=400');
                if (printWindow) {
                  printWindow.document.write(`<html><head><title>Thermal Receipt Print</title><style>body{font-family:monospace;padding:20px;}</style></head><body>${printContents}</body></html>`);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Sample 80mm Receipt
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
