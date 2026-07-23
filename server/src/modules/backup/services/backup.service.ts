import { backupRepository } from "../backup.repository";
import { BackupType, BackupStatus } from "@prisma/client";
import { LocalDiskStorageProvider } from "../providers/local.provider";
import auditService from "../../audit/audit.service";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import util from "util";
import crypto from "crypto";
const archiver = require("archiver");

const execPromise = util.promisify(exec);

export class BackupService {
  private storageProvider = new LocalDiskStorageProvider();

  private parseDbUrl(url: string) {
    // Expected format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
    const regex = /mysql:\/\/(.*):(.*)@(.*):(\d+)\/(.*)/;
    const match = url.match(regex);
    if (!match) throw new Error("Invalid DATABASE_URL format");
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0],
    };
  }

  async createBackup(type: BackupType, userId?: number) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sqlFileName = `backup_${timestamp}.sql`;
    const zipFileName = `backup_${timestamp}.zip`;
    const tempDir = path.join(process.cwd(), "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sqlFilePath = path.join(tempDir, sqlFileName);
    const zipFilePath = path.join(tempDir, zipFileName);

    // 1. Create DB Record (PENDING)
    const backupRecord = await backupRepository.create({
      fileName: zipFileName,
      filePath: zipFilePath, // Will be updated to storage path
      fileSize: 0,
      backupType: type,
      status: BackupStatus.PENDING,
      createdById: userId,
    });

    try {
      // 2. Dump Database
      const dbUrl = process.env.DATABASE_URL || "";
      const dbConfig = this.parseDbUrl(dbUrl);
      
      const dumpCommand = `mysqldump -u ${dbConfig.user} -p${dbConfig.password} -h ${dbConfig.host} -P ${dbConfig.port} ${dbConfig.database} > "${sqlFilePath}"`;
      await execPromise(dumpCommand);

      // 3. Compress Files
      await this.createZipArchive(sqlFilePath, zipFilePath);

      // 4. Generate Checksum
      const checksum = await this.generateChecksum(zipFilePath);
      const stats = fs.statSync(zipFilePath);

      // 5. Upload to Storage
      const storagePath = await this.storageProvider.upload(zipFilePath, zipFileName);

      // 6. Complete and Cleanup Temp
      await backupRepository.updateStatus(backupRecord.id, BackupStatus.COMPLETED, checksum, stats.size);
      
      fs.unlinkSync(sqlFilePath);
      fs.unlinkSync(zipFilePath);

      // 7. Log to Audit
      await auditService.logEvent({
        userId,
        module: "Backup",
        action: "CREATE_BACKUP",
        entityId: backupRecord.id,
        description: `Successfully created ${type} backup: ${zipFileName}`,
      });

      return await backupRepository.findById(backupRecord.id);

    } catch (error: any) {
      console.error("[BackupService] Backup failed:", error);
      
      await backupRepository.updateStatus(backupRecord.id, BackupStatus.FAILED);
      
      await auditService.logEvent({
        userId,
        module: "Backup",
        action: "CREATE_BACKUP_FAILED",
        entityId: backupRecord.id,
        description: `Failed to create backup: ${error.message}`,
      });

      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  private createZipArchive(sourcePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(destPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Highest compression
      });

      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);
      archive.file(sourcePath, { name: path.basename(sourcePath) });
      archive.finalize();
    });
  }

  private generateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('error', err => reject(err));
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  async verifyBackup(id: number, userId?: number): Promise<boolean> {
    const backup = await backupRepository.findById(id);
    if (!backup || !backup.checksum) throw new Error("Backup or checksum not found");

    const storagePath = path.join(process.cwd(), "backups", backup.fileName);
    if (!fs.existsSync(storagePath)) {
       throw new Error("Backup file not found on disk");
    }

    const currentChecksum = await this.generateChecksum(storagePath);
    const isValid = currentChecksum === backup.checksum;

    await auditService.logEvent({
      userId,
      module: "Backup",
      action: "VERIFY_BACKUP",
      entityId: id,
      description: `Verified backup ${backup.fileName}. Result: ${isValid ? 'Valid' : 'Invalid'}`,
    });

    return isValid;
  }

  async listBackups(page: number, limit: number) {
    return backupRepository.findAll(page, limit);
  }

  async getBackupById(id: number) {
    const backup = await backupRepository.findById(id);
    if (!backup) throw new Error("Backup not found");
    return backup;
  }

  async deleteBackup(id: number, userId?: number) {
    const backup = await backupRepository.findById(id);
    if (!backup) throw new Error("Backup not found");

    await this.storageProvider.delete(backup.fileName);
    await backupRepository.delete(id);

    await auditService.logEvent({
      userId,
      module: "Backup",
      action: "DELETE_BACKUP",
      entityId: id,
      description: `Deleted backup ${backup.fileName}`,
    });
  }

  async cleanupOldBackups(days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const oldBackups = await backupRepository.findOlderThan(cutoffDate);
    for (const backup of oldBackups) {
      await this.storageProvider.delete(backup.fileName);
      await backupRepository.delete(backup.id);
      console.log(`[BackupService] Auto-cleaned old backup: ${backup.fileName}`);
    }
  }
}

export const backupService = new BackupService();
