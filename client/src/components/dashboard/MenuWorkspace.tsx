import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Upload, Trash, Plus, Sparkles, Layers } from 'lucide-react';
import { Category, PreparationArea } from '../../types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: any;
  onSave: (data: any) => Promise<void>;
}

interface VariantItem {
  id?: number;
  name: string;
  price: number;
  isDefault?: boolean;
}

const PRESET_IMAGES = [
  // Food items
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
  { name: 'Sides/Wings', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pasta Noodles', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' },
  { name: 'Grill Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' },
  { name: 'Biryani Rice', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60' },
  { name: 'Salad Bowl', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60' },
  
  // Cold Drinks
  { name: 'Cold Drink/Cola', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60' },
  { name: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=60' },
  { name: 'Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60' },
  
  // Bar items
  { name: 'Cocktail Drink', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=60' },
  { name: 'Beer Mug', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&auto=format&fit=crop&q=60' },
  { name: 'Red Wine', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=60' },
  { name: 'Whiskey Glass', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=60' }
];

const PRESET_SIZE_CHIPS = ['Small', 'Medium', 'Large', 'Family', 'Half', 'Full', '1 Litre', '500ml'];

export const MenuWorkspace: React.FC<MenuModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  initialData,
  onSave 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: categories[0]?.id || 1,
    price: 350 as number | '',
    preparation_area: 'Kitchen' as PreparationArea,
    image: '',
    is_available: true
  });

  // Optional Variants / Sizes state
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<VariantItem[]>([]);
  const [customSizeName, setCustomSizeName] = useState('');
  const [customSizePrice, setCustomSizePrice] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Max limit is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          category_id: initialData.category_id || categories[0]?.id || 1,
          price: initialData.price ?? 350,
          preparation_area: initialData.preparation_area || 'Kitchen',
          image: initialData.image || '',
          is_available: initialData.is_available ?? true
        });

        if (initialData.variants && initialData.variants.length > 0) {
          setHasVariants(true);
          setVariantsList(initialData.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            price: Number(v.price),
            isDefault: v.isDefault ?? false
          })));
        } else {
          setHasVariants(false);
          setVariantsList([]);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          category_id: categories[0]?.id || 1,
          price: 350,
          preparation_area: 'Kitchen',
          image: '',
          is_available: true
        });
        setHasVariants(false);
        setVariantsList([]);
      }
      setCustomSizeName('');
      setCustomSizePrice('');
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleAddVariant = (sizeName: string, priceVal: number) => {
    if (!sizeName.trim() || isNaN(priceVal) || priceVal < 0) return;
    
    setVariantsList(prev => {
      const existsIndex = prev.findIndex(v => v.name.toLowerCase() === sizeName.trim().toLowerCase());
      if (existsIndex > -1) {
        return prev.map((v, i) => i === existsIndex ? { ...v, price: priceVal } : v);
      }
      return [...prev, { name: sizeName.trim(), price: priceVal, isDefault: prev.length === 0 }];
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        price: Number(formData.price) || 0
      };

      if (hasVariants && variantsList.length > 0) {
        payload.variants = variantsList.map(v => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name,
          price: Number(v.price),
          isDefault: v.isDefault ?? false
        }));
        // Use first variant price as base price
        payload.price = Number(variantsList[0].price);
      } else {
        payload.variants = [];
      }

      await onSave(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          
          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Item Name *
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-sm text-slate-800"
                placeholder="e.g. Gourmet Zinger Burger or Pepsi 1.5L"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl h-20 resize-none focus:ring-2 focus:ring-orange-500 outline-none transition text-xs text-slate-800"
                placeholder="Short description or ingredient notes"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select 
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Base Price (PKR) {!hasVariants && '*'}
                </label>
                <input 
                  type="number" 
                  required={!hasVariants}
                  min="0"
                  disabled={hasVariants}
                  value={formData.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, price: val === '' ? '' : parseInt(val, 10)});
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-sm font-mono ${
                    hasVariants 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preparation Area *
                </label>
                <select 
                  value={formData.preparation_area}
                  onChange={(e) => setFormData({...formData, preparation_area: e.target.value as PreparationArea})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="Kitchen">Kitchen Station</option>
                  <option value="Bar">Bar Station</option>
                </select>
              </div>
              
              <div className="flex items-center pt-5">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={formData.is_available}
                    onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700">In Stock & Available</span>
                </label>
              </div>
            </div>

            {/* OPTIONAL PORTION SIZES & VARIANTS SECTION */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Portion Sizes &amp; Variants (Optional)
                  </span>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  <span className="ml-2 text-[11px] font-bold text-slate-600">Enable Sizes</span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                  
                  {/* Quick Preset Size Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Quick Preset Sizes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SIZE_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setCustomSizeName(chip);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-orange-400 hover:bg-orange-50 transition cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Size Name & Price Inputs */}
                  <div className="flex flex-col sm:flex-row items-end gap-2 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex-1 w-full">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Size Name (Standard or Custom)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Small, Large, Jumbo 16 inch"
                        value={customSizeName}
                        onChange={(e) => setCustomSizeName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white font-medium"
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Price (PKR)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 750"
                        min="0"
                        value={customSizePrice}
                        onChange={(e) => setCustomSizePrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const priceNum = parseFloat(customSizePrice);
                        if (customSizeName && !isNaN(priceNum)) {
                          handleAddVariant(customSizeName, priceNum);
                          setCustomSizeName('');
                          setCustomSizePrice('');
                        } else {
                          alert('Please enter a valid size name and price.');
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0 flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Size
                    </button>
                  </div>

                  {/* Configured Sizes List */}
                  {variantsList.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Configured Item Sizes ({variantsList.length})
                      </span>
                      <div className="space-y-1.5">
                        {variantsList.map((v, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{v.name}</span>
                              {idx === 0 && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                  Default Size
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-extrabold text-orange-600">
                                PKR {v.price}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No sizes added yet. Use preset chips or type a custom size above.
                    </p>
                  )}

                </div>
              )}
            </div>

            {/* Image Selection Area */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Product Representation Image</label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-44 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative shrink-0">
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition"
                        title="Remove Image"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <ImageIcon className="w-8 h-8 stroke-1" />
                      <span className="text-[10px] mt-1 font-medium">No Image Selected</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="menu-item-image-upload"
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-200 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      Upload from Computer
                    </label>
                    <input
                      type="file"
                      id="menu-item-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Or Paste Image URL</span>
                    <input 
                      type="text" 
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none text-xs transition"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Presets Selector Slider */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Choose from High-Resolution Presets</span>
                <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({...formData, image: img.url})}
                      className={`shrink-0 relative w-16 h-12 rounded-xl overflow-hidden border-2 transition flex flex-col justify-end p-1 ${
                        formData.image === img.url ? 'border-orange-500 shadow-md scale-95' : 'border-slate-200/50 hover:border-slate-350'
                      }`}
                      title={img.name}
                    >
                      <img src={img.url} alt={img.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                      <span className="relative z-10 text-[7px] text-white font-bold tracking-tight truncate w-full text-left leading-none">
                        {img.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition disabled:opacity-50 flex justify-center items-center gap-2 text-xs"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
