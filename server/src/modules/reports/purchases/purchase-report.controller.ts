import { Request, Response, NextFunction } from "express";
import purchaseReportService from "./purchase-report.service";
import { sendResponse } from "../../../utils/sendResponse";

export class PurchaseReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReportService.getSummary(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Purchase summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getDaily(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReportService.getDailyPurchases(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Daily purchases retrieved", data });
    } catch (error) { next(error); }
  }

  async getMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await purchaseReportService.getMonthlyPurchases(year);
      sendResponse(res, { statusCode: 200, success: true, message: "Monthly purchases retrieved", data });
    } catch (error) { next(error); }
  }

  async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
      const data = await purchaseReportService.getSupplierReport(supplierId);
      sendResponse(res, { statusCode: 200, success: true, message: "Supplier reports retrieved", data });
    } catch (error) { next(error); }
  }

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReportService.getPurchaseItems(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Purchase items retrieved", data });
    } catch (error) { next(error); }
  }

  async getOutstanding(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReportService.getOutstandingPayments();
      sendResponse(res, { statusCode: 200, success: true, message: "Outstanding payments retrieved", data });
    } catch (error) { next(error); }
  }

  async getTopSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const data = await purchaseReportService.getTopSuppliers(limit);
      sendResponse(res, { statusCode: 200, success: true, message: "Top suppliers retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new PurchaseReportController();
