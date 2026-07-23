import { setupQueueEvents } from "./queue/queue.events";
import { initializeCronJobs } from "./schedulers/cron.scheduler";
import { redis } from "./infrastructure/redis/redis.client";

// Import workers to ensure they are instantiated and start processing
import "./workers/printer.worker";
import "./workers/email.worker";
import "./workers/notification.worker";
import "./workers/backup.worker";
import "./workers/report.worker";
import "./workers/cleanup.worker";
import { printerWorker } from "./workers/printer.worker";
import { emailWorker } from "./workers/email.worker";
import { notificationWorker } from "./workers/notification.worker";
import { backupWorker } from "./workers/backup.worker";
import { reportWorker } from "./workers/report.worker";
import { cleanupWorker } from "./workers/cleanup.worker";

console.log("[Worker] Starting background worker processes...");

// Setup Queue observability
setupQueueEvents();
  
// Start Cron Schedulers
initializeCronJobs();

console.log("[Worker] All background jobs have been initialized successfully.");

const shutdown = async (signal: string) => {
  console.log(`\n[Worker] Received ${signal}. Shutting down gracefully...`);
  
  try {
    console.log("[Worker] Closing BullMQ workers...");
    await Promise.all([
      printerWorker.close(),
      emailWorker.close(),
      notificationWorker.close(),
      backupWorker.close(),
      reportWorker.close(),
      cleanupWorker.close(),
    ]);
    console.log("[Worker] BullMQ workers closed safely");

    redis.quit();
    console.log("[Worker] Redis disconnected");

    process.exit(0);
  } catch (error) {
    console.error("[Worker] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
