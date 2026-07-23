/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { MenuItem, Category, PreparationArea } from '../../types';
import { formatPKR } from './StatisticsCards';
import { 
  BookOpen, Plus, Search, Filter, Edit2, Trash2, Eye, X, Check, AlertTriangle, 
  Sparkles, Coffee, ChefHat, HelpCircle, Image as ImageIcon, RefreshCw, Layers
} from 'lucide-react';
import { MenuWorkspace } from './MenuWorkspace';


export const MenuView: React.FC = () => {
  const { 
    menuItems, 
    categories, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleMenuItemAvailability,
    addNotification 
  } = useDashboard();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [prepAreaFilter, setPrepAreaFilter] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');

  // Modal / overlay states
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);



  // Calculate high-quality menu metrics
  const totalItemsCount = menuItems.length;
  const availableCount = menuItems.filter(item => item.is_available).length;
  const unavailableCount = totalItemsCount - availableCount;
  const kitchenCount = menuItems.filter(item => item.preparation_area === 'Kitchen').length;
  const barCount = menuItems.filter(item => item.preparation_area === 'Bar').length;

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category_id === Number(categoryFilter);
    const matchesPrepArea = prepAreaFilter === 'All' || item.preparation_area === prepAreaFilter;
    
    let matchesAvailability = true;
    if (availabilityFilter === 'Available') matchesAvailability = item.is_available;
    else if (availabilityFilter === 'Unavailable') matchesAvailability = !item.is_available;

    return matchesSearch && matchesCategory && matchesPrepArea && matchesAvailability;
  });

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'Unknown';
  };

  // Open add modal
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setIsAddEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsAddEditModalOpen(true);
  };

  // Open view details
  const handleOpenView = (item: MenuItem) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // Open delete confirmation
  const handleOpenDelete = (itemId: number) => {
    setItemToDeleteId(itemId);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete item
  const confirmDelete = () => {
    if (itemToDeleteId !== null) {
      deleteMenuItem(itemToDeleteId);
      setIsDeleteConfirmOpen(false);
      setItemToDeleteId(null);
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-800 tracking-tight">Master Menu Catalog</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure recipes, commercial pricing, preparational routing and active availability status</p>
            </div>
          </div>
        </div>
        <button
          id="btn-add-menu-item"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition duration-150"
        >
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Menu Operational KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
            <h3 className="font-display text-lg font-black text-slate-800 mt-0.5">{totalItemsCount}</h3>
          </div>
        </div>

        {/* Live Available */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Available</p>
            <h3 className="font-display text-lg font-black text-emerald-600 mt-0.5">{availableCount}</h3>
          </div>
        </div>

        {/* Kitchen Dishes */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kitchen Prep Items</p>
            <h3 className="font-display text-lg font-black text-orange-600 mt-0.5">{kitchenCount}</h3>
          </div>
        </div>

        {/* Bar Beverages */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bar Drink Items</p>
            <h3 className="font-display text-lg font-black text-pink-600 mt-0.5">{barCount}</h3>
          </div>
        </div>
      </div>

      {/* Searching & Advanced Filters Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="menu-search-input"
              type="text"
              placeholder="Search by item name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-none transition duration-150"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
            
            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <select
                id="menu-filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={`filter-cat-${cat.id}`} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Preparation Area Filter */}
            <div className="flex flex-col gap-1">
              <select
                id="menu-filter-prep"
                value={prepAreaFilter}
                onChange={(e) => setPrepAreaFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition cursor-pointer"
              >
                <option value="All">All Prep Areas</option>
                <option value="Kitchen">Kitchen Only</option>
                <option value="Bar">Bar Only</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex flex-col gap-1">
              <select
                id="menu-filter-availability"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Out of Stock</option>
              </select>
            </div>

          </div>
        </div>

        {/* Clear filters label */}
        {(searchTerm || categoryFilter !== 'All' || prepAreaFilter !== 'All' || availabilityFilter !== 'All') && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
            <p className="text-slate-400">
              Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> of {totalItemsCount} catalog entries matching parameters.
            </p>
            <button
              id="btn-clear-menu-filters"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All');
                setPrepAreaFilter('All');
                setAvailabilityFilter('All');
              }}
              className="font-bold text-orange-500 hover:text-orange-600 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Product Catalog Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map(item => (
            <div 
              key={`menu-item-card-${item.id}`} 
              className={`group rounded-2xl border bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200 ${
                !item.is_available ? 'border-slate-100 opacity-75' : 'border-slate-150'
              }`}
            >
              {/* Product Visual Container */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500" 
                />
                
                {/* Float badges */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <span className={`rounded-lg px-2 py-1 font-mono text-[9px] font-black tracking-wide uppercase shadow-sm ${
                    item.preparation_area === 'Kitchen' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-pink-500 text-white'
                  }`}>
                    {item.preparation_area} Prep
                  </span>
                  
                  <span className="rounded-lg bg-slate-900/85 backdrop-blur-xs text-white px-2 py-1 font-sans text-[9px] font-bold shadow-sm">
                    {getCategoryName(item.category_id)}
                  </span>
                </div>

                {/* Availability pill on top right */}
                <div className="absolute right-3 top-3">
                  <button
                    id={`toggle-avail-card-${item.id}`}
                    onClick={() => toggleMenuItemAvailability(item.id)}
                    title={item.is_available ? 'Switch to Out of Stock' : 'Switch to Available'}
                    className={`rounded-lg px-2 py-1 font-sans text-[9px] font-extrabold uppercase shadow-sm border transition ${
                      item.is_available 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </button>
                </div>
              </div>

              {/* Product Specs Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display text-sm font-extrabold text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2 h-8 leading-relaxed">{item.description || 'No product description configured.'}</p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-orange-500">
                    {formatPKR(item.price)}
                  </span>

                  {/* Actions overlay / footer triggers */}
                  <div className="flex items-center gap-1">
                    
                    {/* View Specs Details */}
                    <button
                      id={`btn-view-item-${item.id}`}
                      onClick={() => handleOpenView(item)}
                      title="View Details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Edit Recipe Specs */}
                    <button
                      id={`btn-edit-item-${item.id}`}
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Product Details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete Item Entry */}
                    <button
                      id={`btn-delete-item-${item.id}`}
                      onClick={() => handleOpenDelete(item.id)}
                      title="Delete Entry"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-display text-sm font-bold text-slate-700 mt-3">No matching menu items</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn't find any products in the master catalog matching your current parameters. Try adjusting your filters.
          </p>
          <button
            id="btn-reset-filters-empty"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
              setPrepAreaFilter('All');
              setAvailabilityFilter('All');
            }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-xs hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT WORKSPACE --- */}
      <MenuWorkspace 
        isOpen={isAddEditModalOpen} 
        onClose={() => setIsAddEditModalOpen(false)} 
        categories={categories}
        initialData={selectedItem} 
        onSave={async (data: any) => {
          if (isEditMode && selectedItem) {
            await updateMenuItem({ ...selectedItem, ...data });
          } else {
            await addMenuItem(data);
          }
          setIsAddEditModalOpen(false);
        }}
      />

      {/* --- DETAIL OVERLAY VIEW --- */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="font-display text-sm font-black text-slate-800">
                  Product Technical Sheet
                </h3>
              </div>
              <button
                id="btn-close-view-modal"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Sheet */}
            <div className="p-5 space-y-4">
              <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.name} 
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover" 
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-orange-100 px-2 py-0.5 font-mono text-[9px] font-bold text-orange-700 uppercase tracking-wide">
                    ID: #{selectedItem.id}
                  </span>
                  <span className={`rounded-lg px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase border ${
                    selectedItem.is_available 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {selectedItem.is_available ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <h4 className="font-display text-base font-black text-slate-800 pt-1">{selectedItem.name}</h4>
                <p className="font-mono text-base font-extrabold text-orange-500">{formatPKR(selectedItem.price)}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                
                {/* Category info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Catalog Category</span>
                  <span className="font-bold text-slate-700">{getCategoryName(selectedItem.category_id)}</span>
                </div>

                {/* Dispatch Station Route */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Dispatch Route</span>
                  <span className="font-bold text-slate-700">{selectedItem.preparation_area} Station</span>
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Date Registered</span>
                  <span className="font-mono text-slate-500">
                    {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString() : '2026-07-01'}
                  </span>
                </div>
              </div>

              {/* Recipe Specifications */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipe Ingredients & Specs</p>
                <div className="rounded-xl bg-slate-50/85 border border-slate-100 p-3 text-xs text-slate-600 leading-relaxed">
                  {selectedItem.description || 'No recipe instructions or ingredient specs added to this master item.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-view-close-bottom"
                  onClick={() => setIsViewModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition w-full text-center"
                >
                  Close Specification Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PRESETS / DELETE CONFIRMATION DIALOG --- */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5 animate-in zoom-in-95 duration-150 space-y-4">
            
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h3 className="font-display text-sm font-black text-slate-800">Confirm Catalog Deletion</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete this menu item from the master POS records? Customers and cashiers will not be able to order this item anymore. This action cannot be undone.
              </p>
            </div>

            {/* Confirmation actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                id="btn-confirm-delete-cancel"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setItemToDeleteId(null);
                }}
                className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-confirm"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition shadow-xs"
              >
                Delete Product
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
