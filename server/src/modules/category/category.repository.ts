import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

class CategoryRepository {
  async create(data: Prisma.CategoryCreateInput | Prisma.CategoryUncheckedCreateInput) {
    return prisma.category.create({
      data,
    });
  }

  async findById(id: number, includeDeleted = false) {
    return prisma.category.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findBySlug(slug: string, includeDeleted = false) {
    return prisma.category.findFirst({
      where: {
        slug,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findByName(name: string, includeDeleted = false) {
    return prisma.category.findFirst({
      where: {
        name,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async existsByName(name: string) {
    const count = await prisma.category.count({
      where: {
        name,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async findAll(args: Prisma.CategoryFindManyArgs) {
    return prisma.category.findMany({
      ...args,
      include: {
        _count: {
          select: {
            menuItems: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });
  }

  async count(where?: Prisma.CategoryWhereInput) {
    return prisma.category.count({
      where,
    });
  }

  async update(id: number, data: Prisma.CategoryUpdateInput | Prisma.CategoryUncheckedUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: number, deletedBy: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return null;
    const timestamp = Date.now();
    const name = category.name.includes('_deleted_') ? category.name : `${category.name}_deleted_${timestamp}`;
    const slug = category.slug.includes('_deleted_') ? category.slug : `${category.slug}_deleted_${timestamp}`;

    return prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }

  async restore(id: number, updatedBy: number) {
    return prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedBy,
      },
    });
  }
}

export default new CategoryRepository();
