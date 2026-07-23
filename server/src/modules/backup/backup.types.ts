import { BackupType } from "@prisma/client";

export interface CreateBackupInput {
  type?: BackupType; // default MANUAL
  userId?: number;
}

export interface ListBackupsQuery {
  page?: number;
  limit?: number;
}
