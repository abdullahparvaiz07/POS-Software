import prisma from "../../config/prisma";
import { KitchenStatus } from "@prisma/client";
import { socketService } from "../../websocket/socket.service";
import { SOCKET_ROOMS } from "../../websocket/socket.rooms";
import { SOCKET_EVENTS } from "../../websocket/socket.events";
import { NotFoundError } from "../../errors";

class KitchenService {
  async getQueue() {
    const queue = await prisma.kitchenQueue.findMany({
      where: {
        status: {
          notIn: [KitchenStatus.SERVED, KitchenStatus.CANCELLED]
        }
      },
      include: {
        orderItem: {
          include: {
            order: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return queue.map(q => ({
      id: q.id,
      order_item_id: q.orderItemId,
      order_id: q.orderItem.order.id,
      order_number: q.orderItem.order.orderNumber,
      menu_item_name: q.orderItem.menuItemName,
      variant_name: q.orderItem.variantName || q.orderItem.customVariantName,
      quantity: q.orderItem.quantity,
      notes: q.orderItem.notes,
      status: q.status,
      preparation_area: "Kitchen",
      created_at: q.createdAt.toISOString(),
      assigned_staff_id: q.assignedChefId
    }));
  }

  async updateStatus(id: number, status: KitchenStatus) {
    const queueItem = await prisma.kitchenQueue.update({
      where: { id },
      data: { status },
      include: { orderItem: { include: { order: true } } }
    });

    await prisma.orderItem.update({
      where: { id: queueItem.orderItemId },
      data: { status: status as any }
    });
    
    const mapped = {
      id: queueItem.id,
      order_item_id: queueItem.orderItemId,
      order_id: queueItem.orderItem.order.id,
      order_number: queueItem.orderItem.order.orderNumber,
      menu_item_name: queueItem.orderItem.menuItemName,
      variant_name: queueItem.orderItem.variantName || queueItem.orderItem.customVariantName,
      quantity: queueItem.orderItem.quantity,
      notes: queueItem.orderItem.notes,
      status: queueItem.status,
      preparation_area: "Kitchen",
      created_at: queueItem.createdAt.toISOString(),
      assigned_staff_id: queueItem.assignedChefId
    };

    socketService.emitToRoom(SOCKET_ROOMS.KITCHEN, SOCKET_EVENTS.KITCHEN_QUEUE_UPDATED, mapped);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, mapped);

    return mapped;
  }

  async assignStaff(id: number, staffId: number) {
    const queueItem = await prisma.kitchenQueue.update({
      where: { id },
      data: { assignedChefId: staffId },
      include: { orderItem: { include: { order: true } } }
    });

    const mapped = {
      id: queueItem.id,
      order_item_id: queueItem.orderItemId,
      order_id: queueItem.orderItem.order.id,
      order_number: queueItem.orderItem.order.orderNumber,
      menu_item_name: queueItem.orderItem.menuItemName,
      variant_name: queueItem.orderItem.variantName || queueItem.orderItem.customVariantName,
      quantity: queueItem.orderItem.quantity,
      notes: queueItem.orderItem.notes,
      status: queueItem.status,
      preparation_area: "Kitchen",
      created_at: queueItem.createdAt.toISOString(),
      assigned_staff_id: queueItem.assignedChefId
    };

    socketService.emitToRoom(SOCKET_ROOMS.KITCHEN, SOCKET_EVENTS.KITCHEN_QUEUE_UPDATED, mapped);
    socketService.emitToRoom(SOCKET_ROOMS.DASHBOARD, SOCKET_EVENTS.DASHBOARD_UPDATED, mapped);
    
    return mapped;
  }
}

export default new KitchenService();