import { api } from './api';
import { Category } from '../types';

export const categoryService = {
  getAllCategories: async (params?: any): Promise<Category[]> => {
    const response = await api.get('/categories', { params });
    return response.data.data.map((c: any) => ({
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt,
      items_count: c._count?.menuItems || 0
    }));
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    const c = response.data.data;
    return {
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt
    };
  },

  createCategory: async (data: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
    const response = await api.post('/categories', {
      ...data,
      isActive: data.status === 'Active'
    });
    const c = response.data.data;
    return {
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt
    };
  },

  updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, {
      ...data,
      ...(data.status && { isActive: data.status === 'Active' })
    });
    const c = response.data.data;
    return {
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt
    };
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  restoreCategory: async (id: number): Promise<Category> => {
    const response = await api.patch(`/categories/${id}/restore`);
    const c = response.data.data;
    return {
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt
    };
  },
  
  toggleStatus: async (id: number, isActive: boolean): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, { isActive });
    const c = response.data.data;
    return {
      ...c,
      status: c.isActive ? 'Active' : 'Inactive',
      created_at: c.createdAt
    };
  }
};
