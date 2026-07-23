import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";
import { printerRepository } from "../modules/printer/printer.repository";
import { getPrinterProvider } from "../modules/printer/providers/printer.provider.interface";

export const printerWorker = new Worker(
  QUEUES.PRINTER,
  async (job: Job) => {
    console.log(`[PrinterWorker] Processing job ${job.id}`);
    const { printJobId } = job.data;

    // We assume printJob is previously stored in DB with "PENDING"
    const printJob = await printerRepository.findPrintJobById(printJobId);
    
    if (!printJob) {
      throw new Error(`Print job ${printJobId} not found in database`);
    }

    if (!printJob.printer) {
      await printerRepository.updatePrintJobStatus(printJobId, "FAILED", "Printer not found");
      throw new Error("Printer not found");
    }

    const provider = getPrinterProvider(printJob.printer);
    
    try {
      await printerRepository.updatePrintJobStatus(printJobId, "PRINTING");

      await provider.connect();
      
      for (let i = 0; i < printJob.copies; i++) {
        await provider.print(printJob.content);
      }
      
      await provider.disconnect();

      await printerRepository.updatePrintJobStatus(printJobId, "COMPLETED");
    } catch (error: any) {
      await printerRepository.updatePrintJobStatus(printJobId, "FAILED", error.message);
      throw error; // Re-throw so BullMQ handles retry / failure logic
    }
  },
  {
    connection: queueConnectionOptions,
    concurrency: 5, // Process up to 5 print jobs simultaneously
  }
);
