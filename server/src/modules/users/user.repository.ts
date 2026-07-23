import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class UserRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    roleId?: number;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const { skip, take, search, roleId, status } = params;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
      ...(roleId && {
        userRoles: {
          some: {
            roleId,
          },
        },
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async softDelete(id: number, deletedByUserId: number) {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // To track who deleted, we can log to audit log in service layer
      },
    });
  }

  async restore(id: number) {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async getAdminCount() {
    return prisma.user.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: {
              name: 'ADMIN',
            },
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
