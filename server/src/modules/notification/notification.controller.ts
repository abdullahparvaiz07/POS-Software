import { Request, Response, NextFunction } from "express";
import notificationService from "./services/notification.service";
import { sendResponse } from "../../utils/sendResponse";

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await notificationService.getNotifications(req.user!.id, page, limit);
      sendResponse(res, { statusCode: 200, success: true, message: "Notifications retrieved", data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      sendResponse(res, { statusCode: 200, success: true, message: "Unread count retrieved", data: { unreadCount: count } });
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markRead(parseInt(req.params.id as string), req.user!.id);
      sendResponse(res, { statusCode: 200, success: true, message: "Notification marked as read" });
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.id);
      sendResponse(res, { statusCode: 200, success: true, message: "All notifications marked as read" });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.deleteNotification(parseInt(req.params.id as string), req.user!.id);
      sendResponse(res, { statusCode: 200, success: true, message: "Notification deleted" });
    } catch (error) { next(error); }
  }
}

export default new NotificationController();
