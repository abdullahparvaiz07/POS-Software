import dashboardRepository from "./dashboard.repository";

export class DashboardService {
  async getDashboardData() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      todayStats,
      monthlyRevenue,
      lowStockCount,
      topSellingItems,
      topIngredients,
      recentOrders,
      recentPurchases,
      salesTrend,
      orderTypeBreakdown
    ] = await Promise.all([
      dashboardRepository.getTodayStats(startOfDay, endOfDay),
      dashboardRepository.getMonthlyRevenue(startOfMonth, endOfMonth),
      dashboardRepository.getLowStockCount(),
      dashboardRepository.getTopSellingItems(4),
      dashboardRepository.getTopIngredients(5),
      dashboardRepository.getRecentOrders(5),
      dashboardRepository.getRecentPurchases(5),
      dashboardRepository.getSalesTrend(7),
      dashboardRepository.getOrderTypeBreakdown(startOfDay, endOfDay)
    ]);

    return {
      todayStats: {
        revenue: todayStats.todaySales,
        ordersCount: todayStats.todayOrders,
        activeOrders: todayStats.activeOrders,
        kitchenPending: todayStats.kitchenPending,
        barPending: todayStats.barPending,
        cancelledOrders: todayStats.cancelledOrders,
        cancelledRevenue: todayStats.cancelledRevenue,
        creditOrders: todayStats.creditOrders,
        creditedAmount: todayStats.creditedAmount,
        cashSales: todayStats.cashSales,
      },
      monthlyRevenue,
      lowStockCount,
      topSellingItems: topSellingItems.map((item, idx) => ({
        id: idx + 1,
        name: item.item,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
      })),
      topIngredients: topIngredients.map((ing, idx) => ({
        id: idx + 1,
        name: ing.item,
        quantityUsed: ing.quantity,
      })),
      recentOrders,
      recentPurchases,
      charts: {
        salesTrend: salesTrend.map(trend => ({
          date: trend.date instanceof Date ? trend.date.toISOString() : trend.date,
          revenue: trend.total,
          orders: trend.ordersCount,
        })),
        orderTypeBreakdown: orderTypeBreakdown.map(bt => ({
          type: bt.type,
          count: bt.count,
          revenue: bt.revenue,
        }))
      }
    };
  }
}

export default new DashboardService();