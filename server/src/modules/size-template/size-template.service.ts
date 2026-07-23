import prisma from "../../config/prisma";
import { CreateSizeTemplateDto, UpdateSizeTemplateDto } from "./size-template.types";
import { NotFoundError, ConflictError } from "../../errors";
import { ApiQueryOptions } from "../../shared/types/query.types";
import { buildQuery } from "../../shared/helpers/queryBuilder";
import { formatPaginationMeta } from "../../shared/utils/pagination";

class SizeTemplateService {
  async create(dto: CreateSizeTemplateDto) {
    const existing = await prisma.sizeTemplate.findUnique({ where: { name: dto.name } });
    if (existing && !existing.deletedAt) {
      throw new ConflictError("Size template already exists");
    }

    return prisma.sizeTemplate.create({
      data: {
        name: dto.name,
        items: {
          create: dto.items.map(item => ({
            name: item.name,
            displayOrder: item.displayOrder || 0
          }))
        }
      },
      include: { items: true }
    });
  }

  async findAll(queryOptions: ApiQueryOptions) {
    const { where, orderBy, skip, take, meta } = buildQuery(queryOptions, ["name"]);
    const finalWhere = { ...where, deletedAt: null };

    const [templates, total] = await Promise.all([
      prisma.sizeTemplate.findMany({
        where: finalWhere,
        orderBy,
        skip,
        take,
        include: { items: true }
      }),
      prisma.sizeTemplate.count({ where: finalWhere })
    ]);

    return {
      data: templates,
      meta: formatPaginationMeta(total, meta.page, meta.limit)
    };
  }

  async findById(id: number) {
    const template = await prisma.sizeTemplate.findFirst({
      where: { id, deletedAt: null },
      include: { items: true }
    });
    if (!template) throw new NotFoundError("Size template not found");
    return template;
  }

  async update(id: number, dto: UpdateSizeTemplateDto) {
    const template = await this.findById(id);

    if (dto.name && dto.name !== template.name) {
      const existing = await prisma.sizeTemplate.findUnique({ where: { name: dto.name } });
      if (existing && !existing.deletedAt) throw new ConflictError("Name already in use");
    }

    return prisma.sizeTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.items && {
          items: {
            deleteMany: {},
            create: dto.items.map(item => ({
              name: item.name,
              displayOrder: item.displayOrder || 0
            }))
          }
        })
      },
      include: { items: true }
    });
  }

  async delete(id: number) {
    const template = await this.findById(id);
    const usedInItems = await prisma.menuItem.count({ where: { sizeTemplateId: id, deletedAt: null } });
    if (usedInItems > 0) throw new ConflictError("Template is used by active menu items");

    return prisma.sizeTemplate.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}

export default new SizeTemplateService();
