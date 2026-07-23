import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";

export const notificationWorker = new Worker(
  QUEUES.NOTIFICATION,
  async (job: Job) => {
    console.log(`[NotificationWorker] Processing job ${job.id}`);
    const { userId, type, message } = job.data;
    
    // Stub: Logic to send notification based on type (SMS, Push, In-App, WhatsApp)
    // E.g., await notificationService.send(userId, type, message);
    
    console.log(`[NotificationWorker] Sent ${type} to user ${userId}`);
  },
  {
    connection: queueConnectionOptions,
    concurrency: 10,
  }
);
