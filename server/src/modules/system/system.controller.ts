import { Request, Response, NextFunction } from "express";
import { redis } from "../../infrastructure/redis/redis.client";
import { sendResponse } from "../../utils/sendResponse";
import { allQueues } from "../../queue/queue.manager";

export class SystemController {
  async getRedisHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const startTime = Date.now();
      
      // Ping redis to check connection and latency
      await redis.ping();
      
      const latency = Date.now() - startTime;
      
      // Get basic memory info
      const info = await redis.info("memory");
      const memoryUsageMatch = info.match(/used_memory_human:(.*)/);
      const memoryUsage = memoryUsageMatch ? memoryUsageMatch[1].trim() : "Unknown";

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Redis is healthy",
        data: {
          connected: redis.status === "ready",
          latency: `${latency}ms`,
          memoryUsage,
        },
      });
    } catch (error) {
      sendResponse(res, {
        statusCode: 503,
        success: false,
        message: "Redis is unreachable",
        data: {
          connected: false,
          error: (error as Error).message,
        },
      });
    }
  }
  async getQueueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await Promise.all(
        allQueues.map(async (queue) => {
          const counts = await queue.getJobCounts();
          return {
            name: queue.name,
            active: counts.active,
            waiting: counts.waiting,
            completed: counts.completed,
            failed: counts.failed,
            delayed: counts.delayed,
          };
        })
      );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Queue statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SystemController();
