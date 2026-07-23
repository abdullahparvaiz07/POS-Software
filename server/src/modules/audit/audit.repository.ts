import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

export class AuditRepository {
  async getLogs(page: number, limit: number, filters: {
    userId?: number;
    module?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate };
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    return { data, total };
  }

  async createLog(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  }
}

export default new AuditRepository();
