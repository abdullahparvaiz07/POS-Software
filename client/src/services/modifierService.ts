import { api } from './api';

export const modifierService = {
  getAll: async () => {
    const res = await api.get('/modifiers');
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await api.post('/modifiers', data);
    return res.data.data;
  }
}; 
