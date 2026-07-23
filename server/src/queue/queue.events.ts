import { QueueEvents } from "bullmq";
import { QUEUES } from "./queue.manager";
import { queueConnectionOptions } from "./queue.config";

export const setupQueueEvents = () => {
  const printerEvents = new QueueEvents(QUEUES.PRINTER, { connection: queueConnectionOptions });
  const emailEvents = new QueueEvents(QUEUES.EMAIL, { connection: queueConnectionOptions });
  const notificationEvents = new QueueEvents(QUEUES.NOTIFICATION, { connection: queueConnectionOptions });
  const backupEvents = new QueueEvents(QUEUES.BACKUP, { connection: queueConnectionOptions });
  const reportEvents = new QueueEvents(QUEUES.REPORT, { connection: queueConnectionOptions });
  const cleanupEvents = new QueueEvents(QUEUES.CLEANUP, { connection: queueConnectionOptions });

  const allEvents = [printerEvents, emailEvents, notificationEvents, backupEvents, reportEvents, cleanupEvents];

  allEvents.forEach((events) => {
    events.on("completed", ({ jobId }) => {
      console.log(`[BullMQ] Job ${jobId} completed in queue ${events.name}`);
    });

    events.on("failed", ({ jobId, failedReason }) => {
      console.error(`[BullMQ] Job ${jobId} failed in queue ${events.name}: ${failedReason}`);
    });

    events.on("stalled", ({ jobId }) => {
      console.warn(`[BullMQ] Job ${jobId} stalled in queue ${events.name}`);
    });
  });

  return allEvents;
};
