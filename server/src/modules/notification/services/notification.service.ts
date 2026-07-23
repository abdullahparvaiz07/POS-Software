import notificationRepository from "../repositories/notification.repository";
import { notificationQueue } from "../../../queue/queue.manager";
import { NotificationType, NotificationChannel } from "@prisma/client";

export class NotificationService {
  async send(data: {
    title: string;
    message: string;
    type: NotificationType;
    channels: NotificationChannel[];
    recipientId?: number;
    contactInfo?: { email?: string; phone?: string; pushToken?: string };
  }) {
    for (const channel of data.channels) {
      if (channel === "IN_APP") {
        await this.createInApp(data);
      } else {
        // Enqueue to background worker for external channels
        await this.queueExternalNotification(channel, data);
      }
    }
  }

  private async createInApp(data: any) {
    if (!data.recipientId) return; // In-app usually requires a specific system user
    await notificationRepository.create({
      title: data.title,
      message: data.message,
      type: data.type,
      channel: "IN_APP",
      recipientId: data.recipientId,
    });
  }

  private async queueExternalNotification(channel: NotificationChannel, data: any) {
    const payload: any = { subject: data.title, body: data.message, title: data.title };
    
    if (channel === "EMAIL" && data.contactInfo?.email) {
      payload.to = data.contactInfo.email;
    } else if ((channel === "SMS" || channel === "WHATSAPP") && data.contactInfo?.phone) {
      payload.to = data.contactInfo.phone;
    } else if (channel === "PUSH" && data.contactInfo?.pushToken) {
      payload.to = data.contactInfo.pushToken;
    } else {
      console.warn(`[NotificationService] Missing contact info for channel ${channel}`);
      return;
    }

    await notificationQueue.add(channel, payload);
  }

  async getNotifications(userId: number, page: number = 1, limit: number = 20) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;

    const result = await notificationRepository.findByUser(userId, page, limit);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      }
    };
  }

  async getUnreadCount(userId: number) {
    return notificationRepository.findUnreadCount(userId);
  }

  async markRead(id: number, userId: number) {
    return notificationRepository.markRead(id, userId);
  }

  async markAllRead(userId: number) {
    return notificationRepository.markAllRead(userId);
  }

  async deleteNotification(id: number, userId: number) {
    return notificationRepository.delete(id, userId);
  }
}

export default new NotificationService();
