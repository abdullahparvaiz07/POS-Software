import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";

export const reportWorker = new Worker(
  QUEUES.REPORT,
  async (job: Job) => {
    console.log(`[ReportWorker] Processing job ${job.id}`);
    const { type, parameters, requestedBy } = job.data;
    
    // Stub: Logic to generate heavy reports (PDF, Excel) and then email/notify user
    // const reportUrl = await reportService.generate(type, parameters);
    // await emailQueue.add("report-ready", { to: requestedBy, url: reportUrl });

    console.log(`[ReportWorker] Generated report of type ${type}`);
  },
  {
    connection: queueConnectionOptions,
    concurrency: 2,
  }
);
