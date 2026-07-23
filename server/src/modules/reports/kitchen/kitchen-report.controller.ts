import { Request, Response, NextFunction } from "express";
import kitchenReportService from "./kitchen-report.service";
import { sendResponse } from "../../../utils/sendResponse";

export class KitchenReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getSummary(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Kitchen summary retrieved", data });
    } catch (error) { next(error); }
  }

  async getPreparationTime(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getPreparationTime(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Preparation time retrieved", data });
    } catch (error) { next(error); }
  }

  async getChefPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getChefPerformance(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Chef performance retrieved", data });
    } catch (error) { next(error); }
  }

  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getQueueAnalysis();
      sendResponse(res, { statusCode: 200, success: true, message: "Queue analysis retrieved", data });
    } catch (error) { next(error); }
  }

  async getDelayedOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getDelayedOrders(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Delayed orders retrieved", data });
    } catch (error) { next(error); }
  }

  async getPeakHours(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getPeakHours(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Peak hours retrieved", data });
    } catch (error) { next(error); }
  }

  async getMenuPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      // Menu performance is similar to preparation time but might have different presentation
      const data = await kitchenReportService.getPreparationTime(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Menu performance retrieved", data });
    } catch (error) { next(error); }
  }

  async getEfficiency(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenReportService.getEfficiency(req.query.startDate as string, req.query.endDate as string);
      sendResponse(res, { statusCode: 200, success: true, message: "Kitchen efficiency retrieved", data });
    } catch (error) { next(error); }
  }
}

export default new KitchenReportController();
