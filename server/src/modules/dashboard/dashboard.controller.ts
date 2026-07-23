import { Request, Response, NextFunction } from "express";
import dashboardService from "./dashboard.service";
import { sendResponse } from "../../utils/sendResponse";

export class DashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDashboardData();
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Dashboard data retrieved successfully",
        data,
      });
    } catch (error) {
      console.error("Dashboard controller error:", error);
      next(error);
    }
  }
}

export default new DashboardController();