import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";

export const emailWorker = new Worker(
  QUEUES.EMAIL,
  async (job: Job) => {
    console.log(`[EmailWorker] Processing job ${job.id}`);
    const { to, subject, template, context } = job.data;
    
    // Stub: Logic to compile template and send email via SMTP / SendGrid
    // await emailProvider.send(to, subject, template, context);

    console.log(`[EmailWorker] Sent email to ${to} with subject: ${subject}`);
  },
  {
    connection: queueConnectionOptions,
    concurrency: 5,
  }
);
