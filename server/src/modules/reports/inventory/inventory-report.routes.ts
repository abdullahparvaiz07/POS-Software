import { Router } from "express";
import inventoryReportController from "./inventory-report.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { ROLES } from "../../../constants/roles";

const router = Router();

router.use(authenticate);

// Protected by REPORT_VIEW / INVENTORY_REPORT_VIEW logic.
const reportRoles = [ROLES.ADMIN, ROLES.MANAGER];

router.get("/summary", authorize(...reportRoles), inventoryReportController.getSummary);
router.get("/current-stock", authorize(...reportRoles), inventoryReportController.getCurrentStock);
router.get("/low-stock", authorize(...reportRoles), inventoryReportController.getLowStock);
router.get("/movements", authorize(...reportRoles), inventoryReportController.getMovements);
router.get("/valuation", authorize(...reportRoles), inventoryReportController.getValuation);

export default router;
