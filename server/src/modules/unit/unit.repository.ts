import prisma from "../../config/prisma";
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from "./unit.types";
import { Prisma } from "@prisma/client";

export class UnitRepository {
  async create(data: CreateUnitDto) {
    return prisma.unit.create({
      data,
    });
  }

  async findById(id: number) {
    return prisma.unit.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return prisma.unit.findUnique({
      where: { name },
    });
  }

  async findByShortName(shortName: string) {
    return prisma.unit.findUnique({
      where: { shortName },
    });
  }

  async findMany(query: UnitQueryDto) {
    const { search, unitType, isActive, page = "1", limit = "10", sort = "displayOrder" } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.UnitWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortName: { contains: search } },
      ];
    }

    if (unitType) {
      where.unitType = unitType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [data, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take,
        orderBy: sort === "name" ? { name: "asc" } : { displayOrder: "asc" },
      }),
      prisma.unit.count({ where }),
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

  async update(id: number, data: UpdateUnitDto) {
    return prisma.unit.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return prisma.unit.delete({
      where: { id },
    });
  }

  async softDelete(id: number) {
    return prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async countReferences(id: number) {
    const [ingredients, recipes, recipeYields] = await Promise.all([
      prisma.ingredient.count({ where: { unitId: id } }),
      prisma.recipe.count({ where: { yieldUnitId: id } }),
      prisma.recipeItem.count({ where: { ingredient: { unitId: id } } }), // Not strictly required but good if needed
    ]);

    return ingredients + recipes;
  }
}

export default new UnitRepository();
