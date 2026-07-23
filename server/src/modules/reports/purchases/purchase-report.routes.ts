import { Router } from "express";
import purchaseReportController from "./purchase-report.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { ROLES } from "../../../constants/roles";

const router = Router();

router.use(authenticate);

// Protected by REPORT_VIEW / PURCHASE_REPORT_VIEW logic.
const reportRoles = [ROLES.ADMIN, ROLES.MANAGER];

router.get("/summary", authorize(...reportRoles), purchaseReportController.getSummary);
router.get("/daily", authorize(...reportRoles), purchaseReportController.getDaily);
router.get("/monthly", authorize(...reportRoles), purchaseReportController.getMonthly);
router.get("/suppliers", authorize(...reportRoles), purchaseReportController.getSuppliers);
router.get("/items", authorize(...reportRoles), purchaseReportController.getItems);
router.get("/outstanding", authorize(...reportRoles), purchaseReportController.getOutstanding);
router.get("/top-suppliers", authorize(...reportRoles), purchaseReportController.getTopSuppliers);

export default router;
