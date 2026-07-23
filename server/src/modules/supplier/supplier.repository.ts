import prisma from "../../config/prisma";
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from "./supplier.types";
import { Prisma, SupplierStatus } from "@prisma/client";

export class SupplierRepository {
  async create(data: CreateSupplierDto, userId: number) {
    return prisma.supplier.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findById(id: number) {
    return prisma.supplier.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return prisma.supplier.findUnique({
      where: { code },
    });
  }

  async findByName(name: string) {
    return prisma.supplier.findUnique({
      where: { name },
    });
  }

  async findByEmail(email: string) {
    return prisma.supplier.findFirst({
      where: { email },
    });
  }

  async findMany(query: SupplierQueryDto) {
    const { search, status, page = "1", limit = "20", sort = "createdAt" } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.SupplierWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    if (sort === "name") orderBy.name = "asc";
    else orderBy.createdAt = "desc";

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async update(id: number, data: UpdateSupplierDto, userId: number) {
    return prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async delete(id: number) {
    return prisma.supplier.delete({
      where: { id },
    });
  }

  async softDelete(id: number, userId: number) {
    return prisma.supplier.update({
      where: { id },
      data: { 
        status: SupplierStatus.INACTIVE,
        deletedAt: new Date(),
        updatedBy: userId
      },
    });
  }

  async countPurchases(id: number) {
    return prisma.purchase.count({
      where: { supplierId: id },
    });
  }
}

export default new SupplierRepository();
