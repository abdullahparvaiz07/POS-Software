import { api } from './api';
import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  todayStats: {
    revenue: number;
    ordersCount: number;
    activeOrders: number;
    kitchenPending: number;
    barPending: number;
    cancelledOrders: number;
    cancelledRevenue: number;
    creditOrders: number;
    creditedAmount: number;
    cashSales: number;
  };
  monthlyRevenue: number;
  lowStockCount: number;
  topSellingItems: Array<{
    id: number;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  topIngredients: Array<{
    id: number;
    name: string;
    quantityUsed: number;
  }>;
  recentOrders: Array<any>;
  recentPurchases: Array<any>;
  charts: {
    salesTrend: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
    orderTypeBreakdown: Array<{
      type: string;
      count: number;
      revenue: number;
    }>;
  };
}

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardStats> {
    const response = await api.get('/dashboard');
    return response.data.data;
  },
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardSummary,
    refetchInterval: 60000, // refresh every minute
  });
};
