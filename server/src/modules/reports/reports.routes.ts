import { Router } from "express";
import reportsController from "./reports.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "MANAGER"));

router.get("/sales/summary", reportsController.getSalesSummary);
router.get("/inventory/valuation", reportsController.getInventoryValuation);
router.get("/financial/summary", reportsController.getFinancialSummary);
router.get("/staff-performance", reportsController.getStaffPerformance);

export default router;