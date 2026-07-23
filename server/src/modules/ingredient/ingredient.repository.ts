import prisma from "../../config/prisma";
import { CreateIngredientDto, UpdateIngredientDto, IngredientQueryDto } from "./ingredient.types";
import { Prisma } from "@prisma/client";

export class IngredientRepository {
  async create(data: CreateIngredientDto, userId: number) {
    return prisma.ingredient.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findById(id: number) {
    return prisma.ingredient.findUnique({
      where: { id },
      include: { unit: true },
    });
  }

  async findByCode(code: string) {
    return prisma.ingredient.findUnique({
      where: { code },
    });
  }

  async findByName(name: string) {
    return prisma.ingredient.findUnique({
      where: { name },
    });
  }

  async findByBarcode(barcode: string) {
    return prisma.ingredient.findUnique({
      where: { barcode },
    });
  }

  async findMany(query: IngredientQueryDto) {
    const { search, unitId, isPerishable, isActive, page = "1", limit = "20", sort = "createdAt" } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.IngredientWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (unitId) {
      where.unitId = Number(unitId);
    }

    if (isPerishable !== undefined) {
      where.isPerishable = isPerishable === "true";
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const orderBy: Prisma.IngredientOrderByWithRelationInput = {};
    if (sort === "name") orderBy.name = "asc";
    else if (sort === "currentStock") orderBy.currentStock = "asc";
    else orderBy.createdAt = "desc";

    const [data, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { unit: true },
      }),
      prisma.ingredient.count({ where }),
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

  async findLowStock(page = "1", limit = "20") {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.IngredientWhereInput = {
      // Prisma does not support comparing two columns directly in findMany `where` easily without raw queries, 
      // but in this case, minimumStock is a static threshold for each item. However, comparing two fields requires raw or fetching and filtering. 
      // Wait, we can use Prisma's extended where if available, or just fetch all active and filter. 
      // Actually, since minimumStock is just a Decimal and currentStock is Decimal, Prisma cannot do field-to-field comparison in `where`. 
      // So we will do a raw query, or fetch active ingredients and filter.
      // Given the rules, we'll just fetch all active ingredients and filter in memory if the DB isn't huge, or use raw. Let's use raw query for exact filtering.
      // Or simply return ingredients where currentStock <= minimumStock.
    };

    // Since Prisma lacks column-to-column comparison, we can retrieve them by checking if currentStock is low.
    // We will use raw query to properly handle pagination and counting, or we just fetch everything and filter.
    // For simplicity, let's just fetch all active ingredients and filter in memory for now, since it's an initial version.
    // Or we could execute raw SQL. Let's execute raw SQL to be efficient.

    const data = await prisma.$queryRaw<any[]>`
      SELECT i.*, u.name as unitName, u.shortName as unitShortName 
      FROM ingredients i
      JOIN units u ON i.unitId = u.id
      WHERE i.currentStock <= i.minimumStock AND i.isActive = true
      ORDER BY i.currentStock ASC
      LIMIT ${take} OFFSET ${skip}
    `;

    const totalRaw: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM ingredients 
      WHERE currentStock <= minimumStock AND isActive = true
    `;
    const total = Number(totalRaw[0].count);

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

  async update(id: number, data: UpdateIngredientDto, userId: number) {
    return prisma.ingredient.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async delete(id: number) {
    return prisma.ingredient.delete({
      where: { id },
    });
  }

  async softDelete(id: number, userId: number) {
    return prisma.ingredient.update({
      where: { id },
      data: { 
        isActive: false, 
        deletedAt: new Date(),
        updatedBy: userId
      },
    });
  }

  async countReferences(id: number) {
    const [recipes, purchases, stockMovements] = await Promise.all([
      prisma.recipeItem.count({ where: { ingredientId: id } }),
      prisma.purchaseItem.count({ where: { ingredientId: id } }),
      prisma.stockMovement.count({ where: { ingredientId: id } }),
    ]);

    return recipes + purchases + stockMovements;
  }
}

export default new IngredientRepository();
