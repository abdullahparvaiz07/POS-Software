import { backupQueue, cleanupQueue } from "../queue/queue.manager";

export const initializeCronJobs = async () => {
  try {
    // Daily Backup at 02:00 AM
    await backupQueue.add(
      "scheduled-backup",
      { triggeredBy: "cron" },
      {
        repeat: {
          pattern: "0 2 * * *",
        },
      }
    );

    // Daily Cleanup at 03:00 AM
    await cleanupQueue.add(
      "daily-cleanup",
      {},
      {
        repeat: {
          pattern: "0 3 * * *",
        },
      }
    );

    console.log("[Cron Scheduler] Initialized repeatable jobs");
  } catch (error) {
    console.error("[Cron Scheduler] Failed to initialize cron jobs:", error);
  }
};
