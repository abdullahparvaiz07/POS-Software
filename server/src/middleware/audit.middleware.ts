import { Request, Response, NextFunction } from "express";
import auditService from "../modules/audit/audit.service";

/**
 * Middleware to log generic API requests for auditing purposes.
 * Note: For sensitive changes, explicit `auditService.logEvent` calls should be made
 * in the controller/service to capture `oldData` and `newData`.
 */
export const auditMiddleware = (module: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // We only want to log mutations generally
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      // Capture response finish to log success/failure?
      // Or just log the attempt. We will log the attempt asynchronously to avoid blocking.
      
      const userId = req.user?.id;
      const action = req.method;
      
      // Determine entity ID from params if possible
      const entityId = req.params.id ? parseInt(req.params.id as string) : undefined;
      
      const description = `${req.method} request to ${req.originalUrl}`;
      
      // We don't await this so it doesn't block the request lifecycle
      auditService.logEvent({
        userId,
        module,
        action,
        entityId: isNaN(entityId as number) ? undefined : entityId,
        description,
        newData: req.body ? { ...req.body } : undefined,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(err => console.error("Audit log failed in middleware:", err));
    }

    next();
  };
};
