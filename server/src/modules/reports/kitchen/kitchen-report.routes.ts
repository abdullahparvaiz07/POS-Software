import { Router } from "express";
import kitchenReportController from "./kitchen-report.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { ROLES } from "../../../constants/roles";

const router = Router();

router.use(authenticate);

// Protected by REPORT_VIEW / KITCHEN_REPORT_VIEW logic.
const reportRoles = [ROLES.ADMIN, ROLES.MANAGER];

router.get("/summary", authorize(...reportRoles), kitchenReportController.getSummary);
router.get("/preparation-time", authorize(...reportRoles), kitchenReportController.getPreparationTime);
router.get("/chef-performance", authorize(...reportRoles), kitchenReportController.getChefPerformance);
router.get("/queue", authorize(...reportRoles), kitchenReportController.getQueue);
router.get("/delayed", authorize(...reportRoles), kitchenReportController.getDelayedOrders);
router.get("/peak-hours", authorize(...reportRoles), kitchenReportController.getPeakHours);
router.get("/menu-performance", authorize(...reportRoles), kitchenReportController.getMenuPerformance);
router.get("/efficiency", authorize(...reportRoles), kitchenReportController.getEfficiency);

export default router;
