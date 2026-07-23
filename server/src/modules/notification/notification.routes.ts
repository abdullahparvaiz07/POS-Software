import { Router } from "express";
import notificationController from "./notification.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All notification endpoints are for the authenticated user themselves.
// We don't strictly need ROLES.ADMIN/MANAGER here unless we want to restrict who can receive notifications.
// Typically any authenticated user (e.g. Cashier, Chef) can view their own notifications.
router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.delete);

export default router;
