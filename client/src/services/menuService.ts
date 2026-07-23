import { api } from './api';
import { MenuItem } from '../types';

const mapMenuItem = (m: any): MenuItem => ({
  ...m,
  id: Number(m.id),
  name: m.name,
  category_id: Number(m.categoryId || m.category_id || 1),
  description: m.description || '',
  image: m.image || '',
  preparation_area: m.preparationArea ? (m.preparationArea.charAt(0).toUpperCase() + m.preparationArea.slice(1).toLowerCase()) : (m.preparation_area || 'Kitchen'),
  is_available: m.isAvailable !== undefined ? Boolean(m.isAvailable) : (m.is_available !== undefined ? Boolean(m.is_available) : true),
  price: m.variants && m.variants.length > 0 ? Number(m.variants[0].price) : Number(m.price || 0),
  variants: m.variants || []
});

export const menuService = {
  getAllMenuItems: async (): Promise<MenuItem[]> => {
    const response = await api.get('/menu-items');
    return (response.data.data || []).map(mapMenuItem);
  },

  getMenuItemById: async (id: number): Promise<MenuItem> => {
    const response = await api.get(`/menu-items/${id}`);
    return mapMenuItem(response.data.data);
  },

  createMenuItem: async (data: Omit<MenuItem, 'id' | 'created_at'>): Promise<MenuItem> => {
    const hasMultipleVariants = data.variants && data.variants.length > 1;
    const variantsPayload = data.variants && data.variants.length > 0 ? data.variants.map((v: any, index: number) => ({
      name: v.name,
      price: Number(v.price),
      isDefault: v.isDefault ?? index === 0,
      isAvailable: v.isAvailable ?? true
    })) : [
      {
        name: "Regular",
        price: Number(data.price),
        isDefault: true,
        isAvailable: true
      }
    ];

    const payload = {
      name: data.name,
      categoryId: Number(data.category_id),
      description: data.description || "",
      sku: `SKU-${Date.now()}`,
      pricingMode: variantsPayload.length > 1 ? "MULTIPLE_VARIANTS" : "SINGLE_PRICE",
      preparationArea: (data.preparation_area || "Kitchen").toUpperCase(),
      image: data.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
      displayOrder: 0,
      isAvailable: data.is_available ?? true,
      variants: variantsPayload
    };
    const response = await api.post('/menu-items', payload);
    return mapMenuItem(response.data.data);
  },

  updateMenuItem: async (id: number, data: Partial<MenuItem>): Promise<MenuItem> => {
    const payload: any = {
      ...(data.name && { name: data.name }),
      ...(data.category_id && { categoryId: Number(data.category_id) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.preparation_area && { preparationArea: data.preparation_area.toUpperCase() }),
      ...(data.is_available !== undefined && { isAvailable: Boolean(data.is_available) }),
    };

    if (data.variants && data.variants.length > 0) {
      payload.variants = data.variants.map((v: any, index: number) => {
        const variantPayload: any = {
          ...(v.id ? { id: v.id } : {}),
          name: v.name,
          price: Number(v.price),
          isDefault: v.isDefault ?? index === 0,
          isAvailable: v.isAvailable ?? true
        };
        // Remove nulls that fail Zod validation
        if (variantPayload.preparationTime === null) delete variantPayload.preparationTime;
        if (variantPayload.created_at) delete variantPayload.created_at;
        if (variantPayload.updated_at) delete variantPayload.updated_at;
        if (variantPayload.deleted_at) delete variantPayload.deleted_at;
        if (variantPayload.menuItemId) delete variantPayload.menuItemId;
        return variantPayload;
      });
      payload.pricingMode = payload.variants.length > 1 ? "MULTIPLE_VARIANTS" : "SINGLE_PRICE";
    } else if (data.price !== undefined && data.price !== null && (data.price as any) !== '') {
      payload.variants = [
        {
          name: "Regular",
          price: Number(data.price),
          isDefault: true,
          isAvailable: true
        }
      ];
      payload.pricingMode = "SINGLE_PRICE";
    }

    const response = await api.patch(`/menu-items/${id}`, payload);
    return mapMenuItem(response.data.data);
  },

  deleteMenuItem: async (id: number): Promise<void> => {
    await api.delete(`/menu-items/${id}`);
  },
  
  toggleAvailability: async (id: number, isAvailable: boolean): Promise<MenuItem> => {
    const response = await api.patch(`/menu-items/${id}`, { isAvailable });
    return mapMenuItem(response.data.data);
  }
};
