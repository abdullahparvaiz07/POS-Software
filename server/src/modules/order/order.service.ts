import prisma from "../../config/prisma";
import orderBusiness from "./order.business";
import { CreateOrderDto } from "./order.types";
import pricingService from "../pricing/pricing.service";
import orderNumberService from "../order-number/orderNumber.service";
import orderMapper from "./order.mapper";
import orderRepository from "./order.repository";
import orderItemRepository from "./orderItem.repository";
import kitchenQueueRepository from "./kitchenQueue.repository";
import barQueueRepository from "./barQueue.repository";
import { executeTransaction } from "../../shared/database/transaction";
import { NotFoundError, BadRequestError } from "../../errors";
import inventoryService from "../inventory/services/inventory.service";
import stockMovementService from "../inventory/services/stock-movement.service";
import { socketService } from "../../websocket/socket.service";
import { SOCKET_EVENTS } from "../../websocket/socket.events";
import { SOCKET_ROOMS } from "../../websocket/socket.rooms";

class OrderService {
  private waiterRRIndex = 0;
  private riderRRIndex = 0;

  async getEligibleStaffByRole(targetRole: 'WAITER' | 'RIDER') {
    const roleSearch = targetRole === 'WAITER' 
      ? ['WAITER', 'Waiter', 'Waitstaff'] 
      : ['RIDER', 'Rider', 'Delivery Rider', 'Delivery'];

    return prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: {
              name: { in: roleSearch }
            }
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        userRoles: { select: { role: { select: { name: true } } } }
      },
      orderBy: { id: 'asc' }
    });
  }

  async resolveAutoAssignment(dto: CreateOrderDto) {
    const settings = await prisma.settings.findFirst();
    const enableAutoWaiter = settings?.enableAutoWaiterAssignment ?? true;
    const enableAutoRider = settings?.enableAutoRiderAssignment ?? true;

    let waiterId = dto.waiterId;
    let deliveryRiderId = dto.deliveryRiderId;
    let assignmentMethod: 'MANUAL' | 'AUTO' | undefined = dto.assignmentMethod;

    if (dto.orderType === 'DINE_IN') {
      if (dto.waiterId) {
        assignmentMethod = 'MANUAL';
      } else if (enableAutoWaiter) {
        const waiters = await this.getEligibleStaffByRole('WAITER');
        if (waiters.length > 0) {
          const assigned = waiters[this.waiterRRIndex % waiters.length];
          this.waiterRRIndex = (this.waiterRRIndex + 1) % waiters.length;
          waiterId = assigned.id;
          assignmentMethod = 'AUTO';
        }
      }
    } else if (dto.orderType === 'DELIVERY') {
      if (dto.deliveryRiderId) {
        assignmentMethod = 'MANUAL';
      } else if (enableAutoRider) {
        const riders = await this.getEligibleStaffByRole('RIDER');
        if (riders.length > 0) {
          const assigned = riders[this.riderRRIndex % riders.length];
          this.riderRRIndex = (this.riderRRIndex + 1) % riders.length;
          deliveryRiderId = assigned.id;
          assignmentMethod = 'AUTO';
        }
      }
    }

    return { waiterId, deliveryRiderId, assignmentMethod };
  }

  async createOrder(dto: CreateOrderDto, userId: number) {
    // 0. Auto / Manual Staff Assignment resolution
    const staffAssignment = await this.resolveAutoAssignment(dto);
    dto.waiterId = staffAssignment.waiterId;
    dto.deliveryRiderId = staffAssignment.deliveryRiderId;
    dto.assignmentMethod = staffAssignment.assignmentMethod;

    // 1. Business Validation
    const businessData = await orderBusiness.validateOrder(dto);

    // 2. Pricing Calculations
    const pricing = pricingService.calculateOrder(businessData.pricingItems);

    // 3. Begin Master Transaction
    const result = await executeTransaction(async (tx) => {
      // 4. Generate Order Number
      const orderNumberData = await orderNumberService.generate(tx);

      // 5. Build and Create Order Header
      const orderPayload = orderMapper.toOrder(dto, pricing, orderNumberData, userId);
      const order = await orderRepository.create(tx, orderPayload);

      // 6. Build and Create Order Items (Bulk Insert)
      const itemsPayload = orderMapper.toOrderItems(order.id, businessData, pricing);
      await orderItemRepository.createMany(tx, itemsPayload);

      // 7. Fetch Inserted Items (to capture DB-generated auto-increment IDs for queues)
      const insertedItems = await orderItemRepository.findByOrderId(tx, order.id);

      // 8. Prepare & Insert Kitchen Queue
      const kitchenItemIds = insertedItems
        .filter(i => i.preparationArea === "KITCHEN")
        .map(i => i.id);

      if (kitchenItemIds.length > 0) {
        const kitchenPayload = orderMapper.toKitchenQueue(kitchenItemIds);
        await kitchenQueueRepository.createMany(tx, kitchenPayload);
      }

      // 9. Prepare & Insert Bar Queue
      const barItemIds = insertedItems
        .filter(i => i.preparationArea === "BAR")
        .map(i => i.id);

      if (barItemIds.length > 0) {
        const barPayload = orderMapper.toBarQueue(barItemIds);
        await barQueueRepository.createMany(tx, barPayload);
      }

      return { orderId: order.id, hasKitchen: kitchenItemIds.length > 0, hasBar: barItemIds.length > 0 };
    });

    // 10. Fetch Complete Order Payload (outside transaction to guarantee committed data persistence)
    const completeOrder = await orderRepository.findById(result.orderId);

    // 11. Emit Socket Events
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_CREATED, completeOrder);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, completeOrder);
    // Note: KITCHEN_QUEUE_UPDATED and BAR_QUEUE_UPDATED shouldn't be emitted with completeOrder 
    // because they expect a QueueItem payload. Frontend now refreshes queues on ORDER_CREATED.
    if (result.hasKitchen) {
      socketService.emitToRoom(SOCKET_ROOMS.KITCHEN, SOCKET_EVENTS.ORDER_CREATED, completeOrder);
    }
    if (result.hasBar) {
      socketService.emitToRoom(SOCKET_ROOMS.BAR, SOCKET_EVENTS.ORDER_CREATED, completeOrder);
    }

    return completeOrder;
  }

  async getOrders(query: any): Promise<any> {
    const orders = await orderRepository.findAll({
      orderBy: { createdAt: "desc" },
      // Later we can map the `query` object to Prisma Where clause
    });
    return { data: orders, meta: { total: orders.length } };
  }

  async getOrderById(id: any): Promise<any> {
    const order = await orderRepository.findById(Number(id));
    if (!order) throw new NotFoundError("Order not found");
    return order;
  }

  async updateStatus(id: any, status: any, userId: any): Promise<any> {
    const order = await orderRepository.updateStatus(Number(id), status);
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_UPDATED, order);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, order);
    return order;
  }

  async assignStaff(id: any, staffId: any, userId: any): Promise<any> {
    const order = await orderRepository.assignStaff(Number(id), Number(staffId));
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_UPDATED, order);
    return order;
  }

  async markPaid(id: any, method: any, userId: any): Promise<any> {
    const order = await orderRepository.markPaid(Number(id), method);
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_UPDATED, order);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, order);
    return order;
  }

  async cancelOrder(id: any, userId: any): Promise<any> {
    const order = await orderRepository.findById(Number(id));
    if (!order) throw new NotFoundError("Order not found");
    if (order.status === "COMPLETED") {
      throw new BadRequestError("Cannot cancel a completed order.");
    }
    const cancelledOrder = await orderRepository.cancel(Number(id));
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_UPDATED, cancelledOrder);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, cancelledOrder);
    // Remove from queues via sockets
    socketService.emitToRoom(SOCKET_ROOMS.KITCHEN, SOCKET_EVENTS.KITCHEN_QUEUE_UPDATED, cancelledOrder);
    socketService.emitToRoom(SOCKET_ROOMS.BAR, SOCKET_EVENTS.BAR_QUEUE_UPDATED, cancelledOrder);
    return cancelledOrder;
  }

  async completeOrder(id: number, userId: number) {
    const txResult = await executeTransaction(async (tx) => {
      // 1. Fetch Order and check status
      const order = await tx.order.findUnique({
        where: { id },
        include: { orderItems: true },
      });

      if (!order || order.deletedAt) {
        throw new NotFoundError("Order not found");
      }

      if (order.status === "COMPLETED" || order.status === "CANCELLED") {
        throw new BadRequestError(`Cannot complete order in ${order.status} status.`);
      }
      
      if (order.status === "PENDING") {
          throw new BadRequestError(`Order must be in READY or PREPARING state to complete. Current: ${order.status}`);
      }

      // 2. Fetch global settings for allowNegativeInventory
      const settings = await tx.settings.findFirst();
      const allowNegative = settings?.allowNegativeInventory ?? false;

      // 3. Load Recipes for all ordered items
      const menuItemIds = [...new Set(order.orderItems.map(item => item.menuItemId))];
      const recipes = await tx.recipe.findMany({
        where: { menuItemId: { in: menuItemIds }, isActive: true },
        include: { recipeItems: true },
      });

      const recipeMap = new Map();
      recipes.forEach(r => recipeMap.set(r.menuItemId, r));

      // 4. Calculate Consumption
      const consumptionMap = new Map<number, number>(); // ingredientId -> total quantity

      for (const item of order.orderItems) {
        const recipe = recipeMap.get(item.menuItemId);
        if (!recipe || !recipe.recipeItems || recipe.recipeItems.length === 0) {
          // Skip stock deduction if no recipe is configured for this item
          continue;
        }

        for (const recipeItem of recipe.recipeItems) {
          const ingredientId = recipeItem.ingredientId;
          const consumedQuantity = Number(recipeItem.quantity) * item.quantity;
          
          if (consumptionMap.has(ingredientId)) {
            consumptionMap.set(ingredientId, consumptionMap.get(ingredientId)! + consumedQuantity);
          } else {
            consumptionMap.set(ingredientId, consumedQuantity);
          }
        }
      }

      // 5. Validate & Deduct Stock
      for (const [ingredientId, consumedQuantity] of consumptionMap.entries()) {
        const { balanceBefore, balanceAfter } = await inventoryService.decreaseStock(
          tx,
          ingredientId,
          consumedQuantity,
          allowNegative,
          userId
        );

        // 6. Create Stock Movement
        await stockMovementService.createMovement(tx, {
          ingredientId,
          movementType: "SALE",
          referenceType: "ORDER",
          referenceId: order.id,
          quantity: -Math.abs(consumedQuantity),
          balanceBefore,
          balanceAfter,
          createdBy: userId,
        });
      }

      // 7. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          updatedBy: userId,
        },
      });

      return updatedOrder;
    });

    // Broadcast completion event
    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_COMPLETED, txResult);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, txResult);

    return txResult;
  }

  async assignStaffToOrder(orderId: number, data: { waiterId?: number; deliveryRiderId?: number; assignedStaffId?: number; assignmentMethod?: 'MANUAL' | 'AUTO' }, assignedById: number) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    let waiterId = data.waiterId;
    let deliveryRiderId = data.deliveryRiderId;
    let assignmentMethod = data.assignmentMethod || 'MANUAL';

    if (order.orderType === 'DINE_IN' && !waiterId && assignmentMethod === 'AUTO') {
      const waiters = await this.getEligibleStaffByRole('WAITER');
      if (waiters.length > 0) {
        const assigned = waiters[this.waiterRRIndex % waiters.length];
        this.waiterRRIndex = (this.waiterRRIndex + 1) % waiters.length;
        waiterId = assigned.id;
      }
    } else if (order.orderType === 'DELIVERY' && !deliveryRiderId && assignmentMethod === 'AUTO') {
      const riders = await this.getEligibleStaffByRole('RIDER');
      if (riders.length > 0) {
        const assigned = riders[this.riderRRIndex % riders.length];
        this.riderRRIndex = (this.riderRRIndex + 1) % riders.length;
        deliveryRiderId = assigned.id;
      }
    }

    // Support legacy assignedStaffId
    if (order.orderType === 'DINE_IN' && data.assignedStaffId && !waiterId) {
      waiterId = data.assignedStaffId;
    } else if (order.orderType === 'DELIVERY' && data.assignedStaffId && !deliveryRiderId) {
      deliveryRiderId = data.assignedStaffId;
    }

    const updated = await orderRepository.updateStaffAssignment(orderId, {
      waiterId: waiterId !== undefined ? waiterId : order.waiterId,
      deliveryRiderId: deliveryRiderId !== undefined ? deliveryRiderId : order.deliveryRiderId,
      assignedById,
      assignedAt: new Date(),
      assignmentMethod
    });

    socketService.emitToRoom(SOCKET_ROOMS.CASHIER, SOCKET_EVENTS.ORDER_UPDATED, updated);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, updated);

    return updated;
  }
}

export default new OrderService();
