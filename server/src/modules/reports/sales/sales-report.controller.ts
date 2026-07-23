import { Request, Response, NextFunction } from "express";
import salesReportService from "./sales-report.service";
import { sendResponse } from "../../../utils/sendResponse";

export class SalesReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesReportService.getSummary(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Sales summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getDaily(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesReportService.getDailySales(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Daily sales retrieved", data });
    } catch (error) { next(error); }
  }

  async getHourly(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesReportService.getHourlySales(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Hourly sales retrieved", data });
    } catch (error) { next(error); }
  }

  async getTopItems(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const data = await salesReportService.getTopSellingItems(req.query.startDate as string, req.query.endDate as string, limit);
      sendResponse(res, { statusCode: 200, success: true, message: "Top items retrieved", data });
    } catch (error) { next(error); }
  }

  async getOrderTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesReportService.getOrderTypeBreakdown(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Order types retrieved", data });
    } catch (error) { next(error); }
  }

  async getPaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesReportService.getPaymentMethodBreakdown(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Payment methods retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new SalesReportController();
