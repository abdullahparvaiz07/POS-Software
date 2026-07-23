import { api } from './api';

export const sizeTemplateService = {
  getAll: async () => {
    const res = await api.get('/size-templates');
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await api.post('/size-templates', data);
    return res.data.data;
  }
}; 
