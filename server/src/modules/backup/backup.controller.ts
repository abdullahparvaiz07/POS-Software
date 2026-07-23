import { Request, Response, NextFunction } from "express";
import { backupService } from "./services/backup.service";
import { restoreService } from "./services/restore.service";

import { BackupType } from "@prisma/client";
import path from "path";
import fs from "fs";

export class BackupController {
  async createBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.body.type || BackupType.MANUAL;
      const userId = req.user!.id;

      // Start backup asynchronously to not block the request
      backupService.createBackup(type as BackupType, userId).catch(err => {
        console.error("Async backup error:", err);
      });

      res.status(202).json({
        success: true,
        message: "Backup process has been started successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async listBackups(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await backupService.listBackups(page, limit);

      res.status(200).json({
        success: true,
        message: "Backups retrieved successfully",
        data: result.data,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const backup = await backupService.getBackupById(id);

      const filePath = path.join(process.cwd(), "backups", backup.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "Backup file not found on disk" });
      }

      res.download(filePath, backup.fileName);
    } catch (error) {
      next(error);
    }
  }

  async restoreBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;

      // In a real scenario, this should be handled extremely carefully.
      await restoreService.restoreBackup(id, userId);

      res.status(200).json({
        success: true,
        message: "Database restored successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;

      await backupService.deleteBackup(id, userId);

      res.status(200).json({
        success: true,
        message: "Backup deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;

      const isValid = await backupService.verifyBackup(id, userId);

      res.status(200).json({
        success: true,
        message: isValid ? "Backup is valid" : "Backup verification failed",
        data: { isValid },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BackupController();
