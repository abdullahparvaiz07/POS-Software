import prisma from "../../config/prisma";
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseQueryDto } from "./purchase.types";
import { Prisma } from "@prisma/client";

export class PurchaseRepository {
  async create(data: CreatePurchaseDto, userId: number) {
    return prisma.purchase.create({
      data: {
        ...data,
        purchaseNumber: data.purchaseNumber as string,
        purchaseDate: new Date(data.purchaseDate),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        supplier: true,
      },
    });
  }

  async findById(id: number) {
    return prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });
  }

  async findByNumber(purchaseNumber: string) {
    return prisma.purchase.findUnique({
      where: { purchaseNumber },
    });
  }

  async findMany(query: PurchaseQueryDto) {
    const { search, status, paymentStatus, supplierId, from, to, page = "1", limit = "20", sort = "createdAt" } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PurchaseWhereInput = {
      deletedAt: null, // Don't return soft-deleted purchases by default unless we want to, but standard soft delete typically omits them
    };

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search } },
        { invoiceNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.purchaseStatus = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    if (from || to) {
      where.purchaseDate = {};
      if (from) where.purchaseDate.gte = new Date(from);
      if (to) where.purchaseDate.lte = new Date(to);
    }

    const orderBy: Prisma.PurchaseOrderByWithRelationInput = {};
    if (sort === "purchaseDate") orderBy.purchaseDate = "desc";
    else orderBy.createdAt = "desc";

    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { supplier: true },
      }),
      prisma.purchase.count({ where }),
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

  async update(id: number, data: UpdatePurchaseDto, userId: number) {
    const updateData: any = { ...data, updatedBy: userId };
    
    if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.expectedDate !== undefined) updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;

    return prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
      },
    });
  }

  async softDelete(id: number, userId: number) {
    return prisma.purchase.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}

export default new PurchaseRepository();
