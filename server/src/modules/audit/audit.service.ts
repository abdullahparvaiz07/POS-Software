import auditRepository from "./audit.repository";
import { BadRequestError } from "../../errors";
import { Prisma } from "@prisma/client";

export class AuditService {
  async getLogs(
    page: number = 1,
    limit: number = 10,
    filters: {
      userId?: number;
      module?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    let start: Date | undefined;
    let end: Date | undefined;

    if (filters.startDate && filters.endDate) {
      start = new Date(filters.startDate);
      end = new Date(filters.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError("Invalid date format. Use YYYY-MM-DD.");
      }
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
    }

    const result = await auditRepository.getLogs(page, limit, {
      ...filters,
      startDate: start,
      endDate: end,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      }
    };
  }

  async logEvent(data: {
    userId?: number;
    module: string;
    action: string;
    entityId?: number;
    description?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      // Clean up sensitive fields before logging (like passwords)
      if (data.oldData && data.oldData.password) data.oldData.password = "***";
      if (data.newData && data.newData.password) data.newData.password = "***";

      await auditRepository.createLog({
        userId: data.userId,
        module: data.module,
        action: data.action,
        entityId: data.entityId,
        description: data.description,
        oldData: data.oldData ? (data.oldData as any) : Prisma.JsonNull,
        newData: data.newData ? (data.newData as any) : Prisma.JsonNull,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      // Usually, audit logs failing shouldn't bring down the main transaction,
      // but if we await it, it could. Usually it's better to swallow or log to console.
      console.error("Failed to create audit log", error);
    }
  }
}

export default new AuditService();
