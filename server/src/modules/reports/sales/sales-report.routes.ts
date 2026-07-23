import { Router } from "express";
import salesReportController from "./sales-report.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { ROLES } from "../../../constants/roles";

const router = Router();

router.use(authenticate);

// Protected by REPORT_VIEW / SALES_REPORT_VIEW logic.
// Currently mapped to ADMIN and MANAGER.
const reportRoles = [ROLES.ADMIN, ROLES.MANAGER];

router.get("/summary", authorize(...reportRoles), salesReportController.getSummary);
router.get("/daily", authorize(...reportRoles), salesReportController.getDaily);
router.get("/hourly", authorize(...reportRoles), salesReportController.getHourly);
router.get("/top-items", authorize(...reportRoles), salesReportController.getTopItems);
router.get("/order-types", authorize(...reportRoles), salesReportController.getOrderTypes);
router.get("/payment-methods", authorize(...reportRoles), salesReportController.getPaymentMethods);

export default router;
