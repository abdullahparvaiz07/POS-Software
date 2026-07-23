import { Request, Response, NextFunction } from "express";
import reportsService from "./reports.service";
import { sendResponse } from "../../utils/sendResponse";

export class ReportsController {
  async getSalesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await reportsService.getSalesSummary(startDate as string, endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Sales summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getInventoryValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getInventoryValuation();
      sendResponse(res, { statusCode: 200, success: true, message: "Inventory valuation retrieved", data });
    } catch (error) { next(error); }
  }

  async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await reportsService.getFinancialSummary(startDate as string, endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Financial summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getStaffPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await reportsService.getStaffPerformance(startDate as string, endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Staff performance report retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new ReportsController();