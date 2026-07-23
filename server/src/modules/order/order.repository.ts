import prisma from "../../config/prisma";
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { ORDER_DETAILS_INCLUDE } from "./order.includes";

class OrderRepository {
  async create(tx: Prisma.TransactionClient, data: Prisma.OrderUncheckedCreateInput) {
    return tx.order.create({
      data
    });
  }

  async findById(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: ORDER_DETAILS_INCLUDE
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_DETAILS_INCLUDE
    });
  }

  async findAll(args: Prisma.OrderFindManyArgs) {
    return prisma.order.findMany({
      ...args,
      include: ORDER_DETAILS_INCLUDE
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async assignStaff(id: number, assignedStaffId: number) {
    return prisma.order.update({
      where: { id },
      data: { assignedStaffId },
      include: ORDER_DETAILS_INCLUDE
    });
  }

  async updateStaffAssignment(id: number, data: { waiterId?: number | null; deliveryRiderId?: number | null; assignedById?: number | null; assignedAt?: Date; assignmentMethod?: 'MANUAL' | 'AUTO' }) {
    return prisma.order.update({
      where: { id },
      data: {
        waiterId: data.waiterId !== undefined ? data.waiterId : undefined,
        deliveryRiderId: data.deliveryRiderId !== undefined ? data.deliveryRiderId : undefined,
        assignedStaffId: (data.waiterId || data.deliveryRiderId) ? (data.waiterId || data.deliveryRiderId) : undefined,
        assignedById: data.assignedById,
        assignedAt: data.assignedAt || new Date(),
        assignmentMethod: data.assignmentMethod
      },
      include: ORDER_DETAILS_INCLUDE
    });
  }

  async markPaid(id: number, paymentMethod: PaymentMethod) {
    return prisma.order.update({
      where: { id },
      data: { 
        paymentStatus: PaymentStatus.PAID,
        paymentMethod
      }
    });
  }

  async cancel(id: number) {
    return prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED }
    });
  }

  async complete(id: number) {
    return prisma.order.update({
      where: { id },
      data: { 
        status: OrderStatus.COMPLETED,
        completedAt: new Date()
      }
    });
  }

  async restore(id: number) {
    return prisma.order.update({
      where: { id },
      data: { deletedAt: null }
    });
  }
}

export default new OrderRepository();
