import prisma from "../../config/prisma";
import { CreateModifierGroupDto, UpdateModifierGroupDto } from "./modifier.types";
import { NotFoundError, ConflictError } from "../../errors";
import { ApiQueryOptions } from "../../shared/types/query.types";
import { buildQuery } from "../../shared/helpers/queryBuilder";
import { formatPaginationMeta } from "../../shared/utils/pagination";

class ModifierService {
  async create(dto: CreateModifierGroupDto) {
    const existing = await prisma.modifierGroup.findUnique({ where: { name: dto.name } });
    if (existing && !existing.deletedAt) {
      throw new ConflictError("Modifier group already exists");
    }

    return prisma.modifierGroup.create({
      data: {
        name: dto.name,
        minSelections: dto.minSelections || 0,
        maxSelections: dto.maxSelections || 1,
        modifiers: {
          create: dto.modifiers.map(mod => ({
            name: mod.name,
            price: mod.price || 0,
            isAvailable: mod.isAvailable !== false
          }))
        }
      },
      include: { modifiers: true }
    });
  }

  async findAll(queryOptions: ApiQueryOptions) {
    const { where, orderBy, skip, take, meta } = buildQuery(queryOptions, ["name"]);
    const finalWhere = { ...where, deletedAt: null };

    const [groups, total] = await Promise.all([
      prisma.modifierGroup.findMany({
        where: finalWhere,
        orderBy,
        skip,
        take,
        include: { modifiers: true }
      }),
      prisma.modifierGroup.count({ where: finalWhere })
    ]);

    return {
      data: groups,
      meta: formatPaginationMeta(total, meta.page, meta.limit)
    };
  }

  async findById(id: number) {
    const group = await prisma.modifierGroup.findFirst({
      where: { id, deletedAt: null },
      include: { modifiers: true }
    });
    if (!group) throw new NotFoundError("Modifier group not found");
    return group;
  }

  async update(id: number, dto: UpdateModifierGroupDto) {
    const group = await this.findById(id);

    if (dto.name && dto.name !== group.name) {
      const existing = await prisma.modifierGroup.findUnique({ where: { name: dto.name } });
      if (existing && !existing.deletedAt) throw new ConflictError("Name already in use");
    }

    return prisma.modifierGroup.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.minSelections !== undefined && { minSelections: dto.minSelections }),
        ...(dto.maxSelections !== undefined && { maxSelections: dto.maxSelections }),
        ...(dto.modifiers && {
          modifiers: {
            deleteMany: {},
            create: dto.modifiers.map(mod => ({
              name: mod.name,
              price: mod.price || 0,
              isAvailable: mod.isAvailable !== false
            }))
          }
        })
      },
      include: { modifiers: true }
    });
  }

  async delete(id: number) {
    const group = await this.findById(id);
    const usedInItems = await prisma.menuItemModifierGroup.count({ where: { modifierGroupId: id } });
    if (usedInItems > 0) throw new ConflictError("Modifier group is used by menu items");

    return prisma.modifierGroup.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}

export default new ModifierService();
