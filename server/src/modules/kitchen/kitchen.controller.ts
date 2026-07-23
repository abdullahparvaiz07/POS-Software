import { Request, Response, NextFunction } from "express";
import kitchenService from "./kitchen.service";
import { KitchenStatus } from "@prisma/client";

class KitchenController {
  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await kitchenService.getQueue();
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const queueItem = await kitchenService.updateStatus(Number(id), status as KitchenStatus);
      res.json({ success: true, data: queueItem });
    } catch (error) {
      next(error);
    }
  }

  async assignStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { staffId } = req.body;
      const queueItem = await kitchenService.assignStaff(Number(id), Number(staffId));
      res.json({ success: true, data: queueItem });
    } catch (error) {
      next(error);
    }
  }
}

export default new KitchenController();