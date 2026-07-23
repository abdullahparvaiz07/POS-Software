import { Worker, Job } from "bullmq";
import { QUEUES } from "../queue/queue.manager";
import { queueConnectionOptions } from "../queue/queue.config";
import { backupService } from "../modules/backup/services/backup.service";
import { BackupType } from "@prisma/client";

export const backupWorker = new Worker(
  QUEUES.BACKUP,
  async (job: Job) => {
    console.log(`[BackupWorker] Processing job ${job.id} - ${job.name}`);

    if (job.name === "scheduled-backup") {
      const backupPath = await backupService.createBackup(BackupType.SCHEDULED, 1);
      return backupPath;
    }
  },
  {
    connection: queueConnectionOptions,
    concurrency: 1, // Backups are heavy, process 1 at a time
  }
);
