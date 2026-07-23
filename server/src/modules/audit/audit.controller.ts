import { Request, Response, NextFunction } from "express";
import auditService from "./audit.service";
import { sendResponse } from "../../utils/sendResponse";

export class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        module: req.query.module as string,
        action: req.query.action as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await auditService.getLogs(page, limit, filters);
      sendResponse(res, { statusCode: 200, success: true, message: "Audit logs retrieved", data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }
}

export default new AuditController();
