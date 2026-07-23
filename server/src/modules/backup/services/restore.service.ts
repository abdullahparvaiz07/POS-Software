import { backupService } from "./backup.service";
import { LocalDiskStorageProvider } from "../providers/local.provider";
import auditService from "../../audit/audit.service";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import util from "util";
import AdmZip from "adm-zip";

const execPromise = util.promisify(exec);

export class RestoreService {
  private storageProvider = new LocalDiskStorageProvider();

  private parseDbUrl(url: string) {
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

  async restoreBackup(id: number, userId: number) {
    console.log(`[RestoreService] Starting restore for backup ${id}`);

    // 1. Verify Checksum first
    const isValid = await backupService.verifyBackup(id, userId);
    if (!isValid) {
      throw new Error("Backup checksum verification failed. Restore aborted.");
    }

    const backup = await backupService.getBackupById(id);
    const tempDir = path.join(process.cwd(), "temp", "restore");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const zipFilePath = path.join(process.cwd(), "backups", backup.fileName);
    
    try {
      // 2. Unzip file
      console.log(`[RestoreService] Unzipping ${zipFilePath}`);
      const zip = new AdmZip(zipFilePath);
      zip.extractAllTo(tempDir, true);

      // Find the .sql file
      const files = fs.readdirSync(tempDir);
      const sqlFile = files.find(f => f.endsWith(".sql"));
      
      if (!sqlFile) {
        throw new Error("No SQL file found in the backup archive.");
      }

      const sqlFilePath = path.join(tempDir, sqlFile);

      // 3. Restore Database
      const dbUrl = process.env.DATABASE_URL || "";
      const dbConfig = this.parseDbUrl(dbUrl);

      console.log(`[RestoreService] Restoring database ${dbConfig.database}`);
      
      // mysql -u USER -pPASSWORD -h HOST -P PORT DATABASE < backup.sql
      const restoreCommand = `mysql -u ${dbConfig.user} -p${dbConfig.password} -h ${dbConfig.host} -P ${dbConfig.port} ${dbConfig.database} < "${sqlFilePath}"`;
      await execPromise(restoreCommand);

      // 4. Cleanup Temp
      fs.unlinkSync(sqlFilePath);
      
      // 5. Log Success
      await auditService.logEvent({
        userId,
        module: "Restore",
        action: "RESTORE_BACKUP",
        entityId: backup.id,
        description: `Successfully restored database from backup: ${backup.fileName}`,
      });

      console.log(`[RestoreService] Restore completed successfully.`);

      return { success: true, message: "Restore completed successfully" };
    } catch (error: any) {
      console.error("[RestoreService] Restore failed:", error);

      await auditService.logEvent({
        userId,
        module: "Restore",
        action: "RESTORE_BACKUP_FAILED",
        entityId: backup.id,
        description: `Failed to restore database from backup: ${error.message}`,
      });

      throw new Error(`Restore failed: ${error.message}`);
    }
  }
}

export const restoreService = new RestoreService();
