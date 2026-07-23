import prisma from "../../config/prisma";
import { Backup, BackupStatus, BackupType } from "@prisma/client";

export class BackupRepository {
  async create(data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    backupType: BackupType;
    status: BackupStatus;
    checksum?: string;
    createdById?: number;
  }): Promise<Backup> {
    return prisma.backup.create({
      data,
    });
  }

  async findAll(page: number, limit: number): Promise<{ data: Backup[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.backup.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, fullName: true, email: true } } },
      }),
      prisma.backup.count(),
    ]);

    return { data, total };
  }

  async findById(id: number): Promise<Backup | null> {
    return prisma.backup.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async updateStatus(id: number, status: BackupStatus, checksum?: string, fileSize?: number): Promise<Backup> {
    const updateData: any = { status };
    if (checksum) updateData.checksum = checksum;
    if (fileSize !== undefined) updateData.fileSize = fileSize;

    return prisma.backup.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<Backup> {
    return prisma.backup.delete({
      where: { id },
    });
  }

  async findOlderThan(date: Date): Promise<Backup[]> {
    return prisma.backup.findMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}

export const backupRepository = new BackupRepository();
