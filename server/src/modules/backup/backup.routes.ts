import { Router } from "express";
import backupController from "./backup.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { getBackupsSchema, backupIdSchema } from "./backup.validation";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Create Backup (Manual)
router.post(
  "/",
  authorize("ADMIN"),
  backupController.createBackup
);

// List Backups
router.get(
  "/",
  authorize("ADMIN"),
  validate(getBackupsSchema),
  backupController.listBackups
);

// Download Backup
router.get(
  "/:id/download",
  authorize("ADMIN"),
  validate(backupIdSchema),
  backupController.downloadBackup
);

// Restore Backup
router.post(
  "/:id/restore",
  authorize("ADMIN"),
  validate(backupIdSchema),
  backupController.restoreBackup
);

// Delete Backup
router.delete(
  "/:id",
  authorize("ADMIN"),
  validate(backupIdSchema),
  backupController.deleteBackup
);

// Verify Backup
router.post(
  "/:id/verify",
  authorize("ADMIN"),
  validate(backupIdSchema),
  backupController.verifyBackup
);

export { router as backupRoutes };
