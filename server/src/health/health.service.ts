import { redis } from "../infrastructure/redis/redis.client";
import prisma from "../config/prisma";
import { printerRepository } from "../modules/printer/printer.repository";
import { allQueues } from "../queue/queue.manager";

export class HealthService {
  async getDatabaseHealth() {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "up",
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: "down",
        error: (error as Error).message,
      };
    }
  }

  async getRedisHealth() {
    const startTime = Date.now();
    try {
      await redis.ping();
      return {
        status: "up",
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: "down",
        error: (error as Error).message,
      };
    }
  }

  async getQueuesHealth() {
    try {
      const stats = await Promise.all(
        allQueues.map(async (queue: any) => {
          const counts = await queue.getJobCounts();
          return {
            name: queue.name,
            counts,
          };
        })
      );
      return {
        status: "up",
        queues: stats,
      };
    } catch (error) {
      return {
        status: "down",
        error: (error as Error).message,
      };
    }
  }

  async getPrintersHealth() {
    try {
      const printers = await printerRepository.findAll();
      return {
        status: "up",
        totalConfigured: printers.length,
        active: printers.filter((p: any) => p.isActive).length,
      };
    } catch (error) {
      return {
        status: "down",
        error: (error as Error).message,
      };
    }
  }
}

export const healthService = new HealthService();
