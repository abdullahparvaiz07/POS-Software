import { api } from './api';

export const reportsService = {
  getSalesSummary: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/sales/summary', { params: { startDate, endDate } });
    return response.data.data;
  },

  getDailySales: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/sales/daily', { params: { startDate, endDate } });
    return response.data.data;
  },

  getTopItems: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/sales/top-items', { params: { startDate, endDate } });
    return response.data.data;
  },

  getInventoryValuation: async () => {
    const response = await api.get('/reports/inventory/valuation');
    return response.data.data;
  },

  getStaffPerformance: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/reports/staff-performance', { params: { startDate, endDate } });
    return response.data.data;
  }
};
