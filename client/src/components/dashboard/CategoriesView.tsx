import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, 
  Layers, Check, X, AlertTriangle, Eye, Tag, Calendar, RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category } from '../../types';
import { useDashboard } from '../../context/DashboardContext';
import { categoryService } from '../../services/categoryService';

// Preset colors for categories
const PRESET_COLORS = [
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Slate', value: '#64748B' },
];

// Preset icons mappings
const PRESET_ICONS = [
  { key: 'layers', component: Layers, name: 'Layers' },
  { key: 'burger', component: Layers, name: 'Burger' }, // Fallback to layers since we don't have all lucide food icons
  { key: 'coffee', component: Layers, name: 'Coffee' },
  { key: 'pizza', component: Layers, name: 'Pizza' },
  { key: 'ice-cream', component: Layers, name: 'Dessert' },
  { key: 'leaf', component: Layers, name: 'Salad' },
  { key: 'flame', component: Layers, name: 'Spicy' },
  { key: 'droplets', component: Layers, name: 'Drinks' },
  { key: 'utensils', component: Layers, name: 'Food' },
  { key: 'tag', component: Tag, name: 'Label' },
];

export const CategoriesView: React.FC = () => {
  const { 
    addNotification, 
    currentUser,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  } = useDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [catToDeleteId, setCatToDeleteId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'tag',
    color: '#F97316',
    status: 'Active' as 'Active' | 'Inactive',
    isCustom: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLoading = false;
  const errorState = null;

  // Derived state
  const activeCount = categories.filter(c => c.status !== 'Inactive').length;
  const inactiveCount = categories.filter(c => c.status === 'Inactive').length;
  const totalCategoriesCount = categories.length;
  const assignedItemsCount = categories.reduce((sum, cat) => sum + (cat.items_count || 0), 0);

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Render category icon dynamically
  const renderCategoryIcon = (iconName: string | undefined, color: string | undefined, sizeClass = "h-5 w-5") => {
    const iconObj = PRESET_ICONS.find(pi => pi.key === iconName) || PRESET_ICONS[9]; // Tag as default
    const IconComponent = iconObj.component;
    const itemColor = color || '#F97316';
    
    return (
      <div 
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition duration-150"
        style={{ backgroundColor: `${itemColor}15`, color: itemColor }}
      >
        <IconComponent className={sizeClass} />
      </div>
    );
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'tag',
      color: '#F97316',
      status: 'Active',
      isCustom: false
    });
    setIsEditMode(false);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'tag',
      color: cat.color || '#F97316',
      status: cat.status || 'Active',
      isCustom: !!cat.isCustom
    });
    setSelectedCategory(cat);
    setIsEditMode(true);
    setIsAddEditModalOpen(true);
  };

  const handleOpenView = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenDelete = (catId: number) => {
    setCatToDeleteId(catId);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addNotification('error', 'Category Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && selectedCategory) {
        await updateCategory({ ...selectedCategory, ...formData });
      } else {
        await addCategory(formData as any);
      }
      setIsAddEditModalOpen(false);
    } catch (err) {
      // already handled
    } finally {
      setIsSaving(false);
    }
  };
  const userRoles = currentUser?.roles?.map(r => r.toUpperCase()) || [];
  const canMutate = userRoles.includes('ADMIN') || userRoles.includes('MANAGER');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-800 tracking-tight">Product Categories</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage commercial catalog classifications, taxonomy structures, and product tags</p>
            </div>
          </div>
        </div>
        {canMutate && (
          <button
            id="btn-add-category"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition duration-150"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Categories KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        
        {/* Total Categories */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Categories</p>
            <h3 className="font-display text-lg font-black text-slate-800 mt-0.5">{totalCategoriesCount}</h3>
          </div>
        </div>

        {/* Active Categories */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Categories</p>
            <h3 className="font-display text-lg font-black text-emerald-600 mt-0.5">{activeCount}</h3>
          </div>
        </div>

        {/* Inactive Categories */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive Categories</p>
            <h3 className="font-display text-lg font-black text-rose-600 mt-0.5">{inactiveCount}</h3>
          </div>
        </div>

        {/* Menu Items Assigned */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Products</p>
            <h3 className="font-display text-lg font-black text-orange-600 mt-0.5">{assignedItemsCount}</h3>
          </div>
        </div>

      </div>

      {/* Advanced Searching & Filtering */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="category-search-input"
            type="text"
            placeholder="Search categories by name, specs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-none transition duration-150"
          />
        </div>

        {/* Filters Select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
            {(['All', 'Active', 'Inactive'] as const).map(tab => (
              <button
                key={`cat-tab-${tab}`}
                id={`cat-filter-${tab.toLowerCase()}`}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition duration-150 ${
                  statusFilter === tab 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Category List - Responsive Table Block */}
      {errorState ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <h4 className="font-display text-sm font-bold text-red-800 mt-2">Error Loading Categories</h4>
          <p className="text-xs text-red-600 mt-1">{errorState}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-400">Loading categories...</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Icon</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4 hidden md:table-cell">Description</th>
                  <th className="py-3 px-4 text-center">Product Count</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Date Created</th>
                  <th className="py-3 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCategories.map(cat => {
                  const isCatActive = cat.status !== 'Inactive';
                  const itemsCount = cat.items_count || 0;
                  
                  return (
                    <tr 
                      key={`category-row-${cat.id}`} 
                      className={`hover:bg-slate-50/50 transition duration-150 ${
                        !isCatActive ? 'opacity-80 bg-slate-50/20' : ''
                      }`}
                    >
                      {/* Category Icon */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">
                          {renderCategoryIcon(cat.icon, cat.color, "h-4.5 w-4.5")}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-extrabold text-slate-800 text-sm">{cat.name}</span>
                          {cat.isCustom && (
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                              Custom
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">ID: #{cat.id}</span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs hidden md:table-cell">
                        <p className="text-slate-500 truncate" title={cat.description}>
                          {cat.description || <span className="italic text-slate-300">No description provided.</span>}
                        </p>
                      </td>

                      {/* Menu Items Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          itemsCount > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {itemsCount} items
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`toggle-status-badge-${cat.id}`}
                          onClick={() => {
                            if (canMutate) {
                              toggleCategoryStatus(cat.id);
                            }
                          }}
                          disabled={!canMutate}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase border tracking-wider transition ${
                            isCatActive 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                          } ${!canMutate ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isCatActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {isCatActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Date Created */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] hidden lg:table-cell">
                        {new Date(cat.created_at || new Date()).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View details */}
                          <button
                            id={`btn-view-cat-${cat.id}`}
                            onClick={() => handleOpenView(cat)}
                            title="View Category Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit Category specs */}
                          {canMutate && (
                            <button
                              id={`btn-edit-cat-${cat.id}`}
                              onClick={() => handleOpenEdit(cat)}
                              title="Edit Category Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Category */}
                          {canMutate && (
                            <button
                              id={`btn-delete-cat-${cat.id}`}
                              onClick={() => handleOpenDelete(cat.id)}
                              title="Delete Category"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <Layers className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-display text-sm font-bold text-slate-700 mt-3">No matching categories found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn't find any taxonomy classification records matching your parameters. Try resetting your filter search.
          </p>
          <button
            id="btn-clear-cat-filters"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-xs hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* --- ADD / EDIT CATEGORY MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="font-display text-sm font-black text-slate-800">
                  {isEditMode ? 'Edit Category Specifications' : 'Add New Category Classification'}
                </h3>
              </div>
              <button
                id="btn-close-add-cat-modal"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Category Name */}
              <div className="space-y-1">
                <label htmlFor="input-cat-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-cat-name"
                  type="text"
                  required
                  placeholder="e.g. Traditional Karahis"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-none transition duration-150"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="textarea-cat-description" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Commercial Description
                </label>
                <textarea
                  id="textarea-cat-description"
                  rows={2}
                  placeholder="Summarize products that fall under this catalog category..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-none transition duration-150 resize-none"
                />
              </div>

              {/* Icon Selector Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Category Aesthetic Icon
                </span>
                <div className="grid grid-cols-5 gap-2 max-h-24 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/30">
                  {PRESET_ICONS.map(pi => {
                    const IconComp = pi.component;
                    const isSelected = formData.icon === pi.key;
                    
                    return (
                      <button
                        type="button"
                        id={`btn-preset-icon-${pi.key}`}
                        key={`preset-icon-${pi.key}`}
                        onClick={() => setFormData(prev => ({ ...prev, icon: pi.key }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50/10 text-orange-600 font-bold' 
                            : 'border-slate-150 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className="h-4.5 w-4.5" />
                        <span className="text-[8px] mt-1 text-slate-400 truncate w-full text-center">{pi.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Color */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Display Color Hue
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => {
                    const isSelected = formData.color === color.value;
                    
                    return (
                      <button
                        type="button"
                        id={`btn-preset-color-${color.name.toLowerCase()}`}
                        key={`preset-color-${color.value}`}
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className="h-7 w-7 rounded-full flex items-center justify-center shadow-xs transition hover:scale-105"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {isSelected && (
                          <Check className="h-4 w-4 text-white font-bold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Status Toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Status Active</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Inactive categories cannot be assigned to new menu items</p>
                </div>
                <button
                  type="button"
                  id="btn-toggle-cat-status-modal"
                  onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.status === 'Active' ? 'bg-orange-500' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Category Toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Custom Category</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mark this category as a custom or miscellaneous category</p>
                </div>
                <button
                  type="button"
                  id="btn-toggle-cat-custom-modal"
                  onClick={() => setFormData(prev => ({ ...prev, isCustom: !prev.isCustom }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isCustom ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.isCustom ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  id="btn-cancel-cat-modal"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-cat-modal"
                  disabled={isSaving}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition shadow-sm flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>{isEditMode ? 'Update Category' : 'Register Category'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- CATEGORY DETAILS DRAWER --- */}
      {isDetailDrawerOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
            
            {/* Drawer Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-150 p-4">
                <div className="flex items-center gap-2.5">
                  {renderCategoryIcon(selectedCategory.icon, selectedCategory.color, "h-5 w-5")}
                  <div>
                    <h3 className="font-display text-sm font-black text-slate-800">{selectedCategory.name} Specs</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Category Specifications Sheet</p>
                  </div>
                </div>
                <button
                  id="btn-close-cat-drawer"
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* General category details */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Aesthetic Display color</span>
                    <div className="flex items-center gap-2">
                      <span className="h-4.5 w-4.5 rounded-full border border-slate-200" style={{ backgroundColor: selectedCategory.color || '#F97316' }} />
                      <span className="font-mono text-xs text-slate-500 uppercase">{selectedCategory.color || '#F97316'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      {selectedCategory.description || <span className="italic text-slate-300">No descriptive brief logged for this category.</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className={`inline-flex items-center gap-1 mt-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        selectedCategory.status !== 'Inactive' ? 'bg-emerald-50 text-emerald-700 font-black' : 'bg-rose-50 text-rose-700 font-black'
                      }`}>
                        {selectedCategory.status || 'Active'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Date</span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(selectedCategory.created_at || new Date()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-150 p-4 bg-slate-50">
              <button
                id="btn-close-cat-drawer-bottom"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition text-center block shadow-sm"
              >
                Close Category Specs
              </button>
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
              <h3 className="font-display text-sm font-black text-slate-800">Confirm Category Deletion</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete this category classification? This action will fail if there are any active menu items linked to this category.
              </p>
            </div>

            {/* Confirmation actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                id="btn-confirm-delete-cat-cancel"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setCatToDeleteId(null);
                }}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-cat-confirm"
                onClick={async () => {
                  if (catToDeleteId !== null) {
                    setIsDeleting(true);
                    try {
                      await deleteCategory(catToDeleteId);
                      setIsDeleteConfirmOpen(false);
                      setCatToDeleteId(null);
                    } catch (err) {
                      // handled in context
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={isDeleting}
                className="flex justify-center items-center gap-2 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting && <RefreshCw className="h-4 w-4 animate-spin" />}
                Delete Category
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
