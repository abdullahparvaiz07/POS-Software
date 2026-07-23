import { Request, Response, NextFunction } from "express";
import financialReportService from "./financial-report.service";
import { sendResponse } from "../../../utils/sendResponse";

export class FinancialReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getSummary(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Financial summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getProfitLoss(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Profit & Loss retrieved", data });
    } catch (error) { next(error); }
  }

  async getRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getRevenue(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Revenue retrieved", data });
    } catch (error) { next(error); }
  }

  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getExpenses(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Expenses retrieved", data });
    } catch (error) { next(error); }
  }

  async getCOGS(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getCOGS(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "COGS retrieved", data });
    } catch (error) { next(error); }
  }

  async getGrossProfit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getGrossProfit(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Gross profit retrieved", data });
    } catch (error) { next(error); }
  }

  async getNetProfit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getNetProfit(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Net profit retrieved", data });
    } catch (error) { next(error); }
  }

  async getTaxes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getTaxes(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Tax summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getDiscounts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getDiscounts(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Discount report retrieved", data });
    } catch (error) { next(error); }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getPayments(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Payment collection retrieved", data });
    } catch (error) { next(error); }
  }

  async getCashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialReportService.getCashFlow(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Cash flow retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new FinancialReportController();
