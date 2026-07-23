import { Request, Response, NextFunction } from "express";
import settingsService from "./settings.service";
import { sendResponse } from "../../utils/sendResponse";

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getSettings();
      sendResponse(res, { statusCode: 200, success: true, message: "Settings retrieved", data });
    } catch (error) { next(error); }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.updateSettings(req.user?.id, req.body, req.ip, req.headers["user-agent"]);
      sendResponse(res, { statusCode: 200, success: true, message: "Settings updated successfully", data });
    } catch (error) { next(error); }
  }
}

export default new SettingsController();