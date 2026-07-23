import { Request, Response } from "express";
import { healthService } from "./health.service";

export class HealthController {
  getSystemHealth(req: Request, res: Response) {
    res.json({
      status: "healthy",
      uptime: process.uptime() + "s",
      version: process.env.npm_package_version || "1.0.0",
    });
  }

  async getDatabaseHealth(req: Request, res: Response) {
    const result = await healthService.getDatabaseHealth();
    res.status(result.status === "up" ? 200 : 503).json(result);
  }

  async getRedisHealth(req: Request, res: Response) {
    const result = await healthService.getRedisHealth();
    res.status(result.status === "up" ? 200 : 503).json(result);
  }

  async getQueuesHealth(req: Request, res: Response) {
    const result = await healthService.getQueuesHealth();
    res.status(result.status === "up" ? 200 : 503).json(result);
  }

  async getPrintersHealth(req: Request, res: Response) {
    const result = await healthService.getPrintersHealth();
    res.status(result.status === "up" ? 200 : 503).json(result);
  }
}

export const healthController = new HealthController();
