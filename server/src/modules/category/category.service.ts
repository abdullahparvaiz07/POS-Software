import categoryRepository from "./category.repository";
import { CATEGORY_MESSAGES } from "./category.constants";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.types";
import { ConflictError, NotFoundError } from "../../errors";
import slugify from "slugify";
import { buildQuery } from "../../shared/helpers/queryBuilder";
import { formatPaginationMeta } from "../../shared/utils/pagination";
import { ApiQueryOptions } from "../../shared/types/query.types";
import { cacheService } from "../../infrastructure/redis/cache.service";
import { CACHE_KEYS } from "../../infrastructure/redis/cache.keys";
import prisma from "../../config/prisma";


class CategoryService {
  async createCategory(dto: CreateCategoryDto, currentUser: any) {
    const name = dto.name.trim();

    const exists = await categoryRepository.existsByName(name);
    if (exists) {
      throw new ConflictError(CATEGORY_MESSAGES.ALREADY_EXISTS);
    }

    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    const result = await categoryRepository.create({
      ...dto,
      name,
      slug,
      createdBy: (currentUser.userId || currentUser.id),
      updatedBy: (currentUser.userId || currentUser.id),
    });
    
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }

  async getAllCategories(queryOptions: ApiQueryOptions) {
    const { where, orderBy, skip, take, meta } = buildQuery(queryOptions, [
      "name",
      "description",
    ]);

    // Ensure we only get non-deleted by default
    const finalWhere = { ...where, deletedAt: null };

    const [categories, total] = await Promise.all([
      categoryRepository.findAll({
        where: finalWhere,
        orderBy,
        skip,
        take,
      }),
      categoryRepository.count(finalWhere),
    ]);

    return {
      data: categories,
      meta: formatPaginationMeta(total, meta.page, meta.limit),
    };
  }

  async getCategoryById(id: number) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
    }

    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto, currentUser: any) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
    }

    let slug = category.slug;
    let name = dto.name;

    if (name && name.trim() !== category.name) {
      name = name.trim();
      const exists = await categoryRepository.existsByName(name);
      if (exists) {
        throw new ConflictError(CATEGORY_MESSAGES.ALREADY_EXISTS);
      }
      slug = slugify(name, {
        lower: true,
        strict: true,
      });
    }

    const result = await categoryRepository.update(id, {
      ...dto,
      ...(name && { name }),
      ...(name && { slug }),
      updatedBy: (currentUser.userId || currentUser.id),
    });
    
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }

  async deleteCategory(id: number, currentUser: any) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
    }

    const activeItemsCount = await prisma.menuItem.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (activeItemsCount > 0) {
      throw new ConflictError(CATEGORY_MESSAGES.HAS_ACTIVE_ITEMS);
    }

    const result = await categoryRepository.softDelete(id, (currentUser.userId || currentUser.id));
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }


  async restoreCategory(id: number, currentUser: any) {
    const category = await categoryRepository.findById(id, true);

    if (!category) {
      throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
    }

    if (!category.deletedAt) {
      return category; // Already active
    }

    const result = await categoryRepository.restore(id, (currentUser.userId || currentUser.id));
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }
}

export default new CategoryService();
