import { api } from './api';

export interface Ingredient {
  id: number;
  name: string;
  unitId: number;
  costPerUnit: number;
  stockQuantity: number;
  minStockLevel: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ingredientService = {
  getIngredients: async (): Promise<Ingredient[]> => {
    const response = await api.get('/ingredients');
    return response.data.data;
  },

  createIngredient: async (ingredient: Partial<Ingredient>): Promise<Ingredient> => {
    const response = await api.post('/ingredients', ingredient);
    return response.data.data;
  },

  updateIngredient: async (id: number, ingredient: Partial<Ingredient>): Promise<Ingredient> => {
    const response = await api.put(`/ingredients/${id}`, ingredient);
    return response.data.data;
  },

  deleteIngredient: async (id: number): Promise<void> => {
    await api.delete(`/ingredients/${id}`);
  }
};
