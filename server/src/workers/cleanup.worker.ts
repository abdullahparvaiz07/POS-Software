import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";

export const cleanupWorker = new Worker(
  QUEUES.CLEANUP,
  async (job: Job) => {
    console.log(`[CleanupWorker] Processing job ${job.name}`);
    
    if (job.name === "daily-cleanup") {
      // Stub: Logic to delete expired tokens, old notifications, old audit logs
      // await authRepository.deleteExpiredTokens();
      // await auditRepository.deleteLogsOlderThan(90);
      console.log("[CleanupWorker] Daily cleanup completed.");
    }
  },
  {
    connection: queueConnectionOptions,
    concurrency: 1,
  }
);
