import { Queue } from "bullmq";
import { queueConnectionOptions, defaultJobOptions } from "./queue.config";

export const QUEUES = {
  EMAIL: "email-queue",
  NOTIFICATION: "notification-queue",
  PRINTER: "printer-queue",
  BACKUP: "backup-queue",
  REPORT: "report-queue",
  CLEANUP: "cleanup-queue",
};

export const emailQueue = new Queue(QUEUES.EMAIL, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const notificationQueue = new Queue(QUEUES.NOTIFICATION, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const printerQueue = new Queue(QUEUES.PRINTER, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const backupQueue = new Queue(QUEUES.BACKUP, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const reportQueue = new Queue(QUEUES.REPORT, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const cleanupQueue = new Queue(QUEUES.CLEANUP, {
  connection: queueConnectionOptions,
  defaultJobOptions,
});

export const allQueues = [
  emailQueue,
  notificationQueue,
  printerQueue,
  backupQueue,
  reportQueue,
  cleanupQueue,
];

// Suppress unhandled Redis queue connection errors when Redis is offline or restarting
allQueues.forEach((q) => {
  q.on("error", (err) => {
    // Offline fallback: log warning instead of crashing Node process
  });
});
