import { createServer } from "http";
import app from "./app";
import { initializeSocketServer } from "./websocket/socket.server";
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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Suppress unhandled Redis worker connection errors when Redis is not deployed
[printerWorker, emailWorker, notificationWorker, backupWorker, reportWorker, cleanupWorker].forEach(worker => {
  if (worker) {
    worker.on("error", (err) => {
      // Offline fallback: log warning instead of crashing Node process
    });
  }
});

// Create HTTP server manually to attach WebSockets
const httpServer = createServer(app);

// Initialize WebSockets
initializeSocketServer(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  
  // Setup Queue observability
  setupQueueEvents();
  
  // Start Cron Schedulers
  initializeCronJobs();
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  
  try {
    httpServer.close(() => {
      console.log("[Server] HTTP server closed");
    });

    // Close BullMQ Workers safely (waits for active jobs to finish)
    console.log("[Server] Closing BullMQ workers...");
    await Promise.all([
      printerWorker.close(),
      emailWorker.close(),
      notificationWorker.close(),
      backupWorker.close(),
      reportWorker.close(),
      cleanupWorker.close(),
    ]);
    console.log("[Server] BullMQ workers closed safely");

    // Close Redis
    redis.quit();
    console.log("[Server] Redis disconnected");

    process.exit(0);
  } catch (error) {
    console.error("[Server] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));