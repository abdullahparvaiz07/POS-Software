import { PrismaClient } from "@prisma/client";
import { logger } from "../logging/logger";
import { metricsService } from "../metrics/metrics.service";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

// Capture queries
prisma.$on("query", (e) => {
  const duration = e.duration;
  
  // Track metric
  metricsService.databaseQueryDuration.observe(
    { query: e.query },
    duration / 1000 // Convert ms to seconds
  );

  // Slow query detection (> 500ms)
  if (duration > 500) {
    metricsService.slowQueriesTotal.inc({ query: e.query });
    logger.warn(`[Slow Query] ${duration}ms - ${e.query} - ${e.params}`);
  }
});

prisma.$on("error", (e) => {
  logger.error(`[Prisma Error] ${e.message}`);
});

prisma.$on("warn", (e) => {
  logger.warn(`[Prisma Warn] ${e.message}`);
});

prisma.$on("info", (e) => {
  logger.info(`[Prisma Info] ${e.message}`);
});

export default prisma;
