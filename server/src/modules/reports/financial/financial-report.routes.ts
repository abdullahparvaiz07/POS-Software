import { Router } from "express";
import financialReportController from "./financial-report.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { ROLES } from "../../../constants/roles";

const router = Router();

router.use(authenticate);

// Protected by REPORT_VIEW / FINANCIAL_REPORT_VIEW logic.
const reportRoles = [ROLES.ADMIN, ROLES.MANAGER];

router.get("/summary", authorize(...reportRoles), financialReportController.getSummary);
router.get("/profit-loss", authorize(...reportRoles), financialReportController.getProfitLoss);
router.get("/revenue", authorize(...reportRoles), financialReportController.getRevenue);
router.get("/expenses", authorize(...reportRoles), financialReportController.getExpenses);
router.get("/cogs", authorize(...reportRoles), financialReportController.getCOGS);
router.get("/gross-profit", authorize(...reportRoles), financialReportController.getGrossProfit);
router.get("/net-profit", authorize(...reportRoles), financialReportController.getNetProfit);
router.get("/taxes", authorize(...reportRoles), financialReportController.getTaxes);
router.get("/discounts", authorize(...reportRoles), financialReportController.getDiscounts);
router.get("/payments", authorize(...reportRoles), financialReportController.getPayments);
router.get("/cashflow", authorize(...reportRoles), financialReportController.getCashFlow);

export default router;
