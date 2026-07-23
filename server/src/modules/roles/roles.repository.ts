import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';

export class RoleRepository {
  async findAll() {
    return prisma.role.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string; isSystem?: boolean; isActive?: boolean }) {
    return prisma.role.create({
      data,
    });
  }
}

export default new RoleRepository();
