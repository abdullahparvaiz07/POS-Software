import { Request, Response, NextFunction } from "express";
import inventoryReportService from "./inventory-report.service";
import { sendResponse } from "../../../utils/sendResponse";

export class InventoryReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryReportService.getSummary();
      sendResponse(res, { statusCode: 200, success: true, message: "Inventory summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getCurrentStock(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      const result = await inventoryReportService.getCurrentStock(page, limit, categoryId);
      sendResponse(res, { statusCode: 200, success: true, message: "Current stock retrieved", data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryReportService.getLowStock();
      sendResponse(res, { statusCode: 200, success: true, message: "Low stock items retrieved", data });
    } catch (error) { next(error); }
  }

  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const ingredientId = req.query.ingredientId ? parseInt(req.query.ingredientId as string) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await inventoryReportService.getMovements(page, limit, startDate, endDate, ingredientId);
      sendResponse(res, { statusCode: 200, success: true, message: "Stock movements retrieved", data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryReportService.getValuation();
      sendResponse(res, { statusCode: 200, success: true, message: "Inventory valuation retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new InventoryReportController();
