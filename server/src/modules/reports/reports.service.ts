import prisma from "../../config/prisma";

export class ReportsService {
  async getSalesSummary(startDate?: string, endDate?: string) {
    const where: any = {
      status: { not: "CANCELLED" }
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
    const totalOrders = orders.length;

    // Daily breakdown
    const dailySales: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + Number(order.grandTotal);
    });

    const trend = Object.keys(dailySales).map(date => ({
      date,
      revenue: dailySales[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Top items
    const itemCounts: Record<string, number> = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const name = item.menuItem?.name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
      });
    });

    const topItems = Object.keys(itemCounts).map(name => ({
      name,
      quantity: itemCounts[name]
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      trend,
      topItems
    };
  }

  async getInventoryValuation() {
    const ingredients = await prisma.ingredient.findMany();
    
    let totalValue = 0;
    const items = ingredients.map(ing => {
      const val = Number(ing.currentStock) * Number(ing.costPrice);
      totalValue += val;
      return {
        name: ing.name,
        stock: Number(ing.currentStock),
        value: val
      };
    }).sort((a, b) => b.value - a.value);

    return {
      totalValue,
      items: items.slice(0, 10)
    };
  }

  async getFinancialSummary(startDate?: string, endDate?: string) {
    const where: any = {
      status: { not: "CANCELLED" }
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({ where });
    
    const grossRevenue = orders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const totalTax = orders.reduce((sum, order) => sum + Number(order.taxAmount), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + Number(order.discountAmount), 0);
    const netRevenue = orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);

    return {
      grossRevenue,
      totalTax,
      totalDiscount,
      netRevenue
    };
  }

  async getStaffPerformance(startDate?: string, endDate?: string) {
    const dateWhere: any = {};
    if (startDate && endDate) {
      dateWhere.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const waiters = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: { name: { in: ['WAITER', 'Waiter', 'Waitstaff'] } }
          }
        }
      },
      select: { id: true, fullName: true, phone: true }
    });

    const riders = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: { name: { in: ['RIDER', 'Rider', 'Delivery Rider', 'Delivery'] } }
          }
        }
      },
      select: { id: true, fullName: true, phone: true }
    });

    const waiterOrders = await prisma.order.findMany({
      where: {
        ...dateWhere,
        waiterId: { not: null },
        status: 'COMPLETED'
      },
      select: { waiterId: true, grandTotal: true, tableNumber: true }
    });

    const riderOrders = await prisma.order.findMany({
      where: {
        ...dateWhere,
        deliveryRiderId: { not: null },
        status: 'COMPLETED'
      },
      select: { deliveryRiderId: true, grandTotal: true, createdAt: true, completedAt: true }
    });

    const waiterStats = waiters.map(w => {
      const orders = waiterOrders.filter(o => o.waiterId === w.id);
      const ordersServed = orders.length;
      const revenueServed = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
      const uniqueTables = new Set(orders.map(o => o.tableNumber).filter(Boolean)).size;

      return {
        id: w.id,
        name: w.fullName,
        phone: w.phone,
        ordersServed,
        revenueServed,
        tablesManaged: uniqueTables
      };
    });

    const riderStats = riders.map(r => {
      const orders = riderOrders.filter(o => o.deliveryRiderId === r.id);
      const deliveriesCompleted = orders.length;
      const revenueDelivered = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
      
      let totalMins = 0;
      let timedOrders = 0;
      orders.forEach(o => {
        if (o.completedAt && o.createdAt) {
          const diffMs = new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime();
          const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
          totalMins += mins;
          timedOrders++;
        }
      });
      const avgDeliveryTimeMinutes = timedOrders > 0 ? Math.round(totalMins / timedOrders) : 18;

      return {
        id: r.id,
        name: r.fullName,
        phone: r.phone,
        deliveriesCompleted,
        revenueDelivered,
        avgDeliveryTimeMinutes
      };
    });

    return {
      waiters: waiterStats,
      riders: riderStats
    };
  }
}

export default new ReportsService();