import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";

export class NotificationRepository {
  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  async findByUser(userId: number, page: number, limit: number) {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.notification.count({ where: { recipientId: userId } })
    ]);
    return { data, total };
  }

  async findUnreadCount(userId: number) {
    return prisma.notification.count({
      where: { recipientId: userId, isRead: false }
    });
  }

  async markRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true }
    });
  }

  async markAllRead(userId: number) {
    return prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true }
    });
  }

  async delete(id: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { id, recipientId: userId }
    });
  }
}

export default new NotificationRepository();
