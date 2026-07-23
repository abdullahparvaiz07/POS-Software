import { Request, Response, NextFunction } from "express";
import barService from "./bar.service";
import { BarStatus } from "@prisma/client";

class BarController {
  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await barService.getQueue();
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const queueItem = await barService.updateStatus(Number(id), status as BarStatus);
      res.json({ success: true, data: queueItem });
    } catch (error) {
      next(error);
    }
  }

  async assignStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { staffId } = req.body;
      const queueItem = await barService.assignStaff(Number(id), Number(staffId));
      res.json({ success: true, data: queueItem });
    } catch (error) {
      next(error);
    }
  }
}

export default new BarController();