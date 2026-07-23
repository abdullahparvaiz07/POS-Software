import { api } from './api';

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data.data;
  },

  updateSettings: async (data: any) => {
    // Filter out internal non-updatable fields like id, createdAt, updatedAt
    const { id, createdAt, updatedAt, ...payload } = data;
    const response = await api.patch('/settings', payload);
    return response.data.data;
  }
};
