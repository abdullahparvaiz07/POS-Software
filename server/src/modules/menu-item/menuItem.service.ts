import menuItemRepository from "./menuItem.repository";
import categoryRepository from "../category/category.repository";
import { MENU_ITEM_MESSAGES } from "./menuItem.constants";
import { CreateMenuItemDto, UpdateMenuItemDto } from "./menuItem.types";
import { ConflictError, NotFoundError } from "../../errors";
import slugify from "slugify";
import { buildQuery } from "../../shared/helpers/queryBuilder";
import { formatPaginationMeta } from "../../shared/utils/pagination";
import { ApiQueryOptions } from "../../shared/types/query.types";
import { cacheService } from "../../infrastructure/redis/cache.service";
import { CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

class MenuItemService {
  async createMenuItem(dto: CreateMenuItemDto, currentUser: any) {
    // 1. Check Category Exists
    const category = await categoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundError(MENU_ITEM_MESSAGES.CATEGORY_NOT_FOUND);
    }

    // 2. Check Duplicate Name among ACTIVE items
    const name = dto.name.trim();
    const exists = await menuItemRepository.existsByName(name);
    if (exists) {
      throw new ConflictError(MENU_ITEM_MESSAGES.DUPLICATE_NAME);
    }

    // 3. Generate Slug
    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    // 4. Safely release any soft-deleted items with matching name/slug/sku so database unique constraint isn't violated
    await menuItemRepository.releaseSoftDeletedUniqueKeys(name, slug, dto.sku);

    const data = {
      categoryId: dto.categoryId,
      name,
      slug,
      sku: dto.sku,
      description: dto.description,
      pricingMode: dto.pricingMode,
      preparationArea: dto.preparationArea,
      image: dto.image,
      displayOrder: dto.displayOrder ?? 0,
      isAvailable: dto.isAvailable ?? true,
      sizeTemplateId: dto.sizeTemplateId,
      createdBy: (currentUser.userId || currentUser.id),
      updatedBy: (currentUser.userId || currentUser.id),
    };

    const result = await menuItemRepository.createWithVariantsAndRecipes(data, dto.variants, dto.modifierGroupIds, (currentUser.userId || currentUser.id));
    await cacheService.delByPattern(`${CACHE_KEYS.MENU_ALL}*`);
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }

  async getAllMenuItems(queryOptions: ApiQueryOptions) {
    const { where, orderBy, skip, take, meta } = buildQuery(queryOptions, [
      "name",
      "description",
      "sku",
    ]);

    const finalWhere = { ...where, deletedAt: null };

    const [menuItems, total] = await Promise.all([
      menuItemRepository.findAll({
        where: finalWhere,
        orderBy,
        skip,
        take,
      }),
      menuItemRepository.count(finalWhere),
    ]);

    return {
      data: menuItems,
      meta: formatPaginationMeta(total, meta.page, meta.limit),
    };
  }

  async getMenuItemById(id: number) {
    const menuItem = await menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundError(MENU_ITEM_MESSAGES.NOT_FOUND);
    }

    return menuItem;
  }

  async updateMenuItem(id: number, dto: UpdateMenuItemDto, currentUser: any) {
    const menuItem = await menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundError(MENU_ITEM_MESSAGES.NOT_FOUND);
    }

    let slug = menuItem.slug;
    let name = dto.name;

    if (name && name.trim() !== menuItem.name) {
      name = name.trim();
      const exists = await menuItemRepository.existsByName(name);
      if (exists) {
        throw new ConflictError(MENU_ITEM_MESSAGES.DUPLICATE_NAME);
      }
      slug = slugify(name, {
        lower: true,
        strict: true,
      });
      await menuItemRepository.releaseSoftDeletedUniqueKeys(name, slug, dto.sku);
    }

    if (dto.categoryId && dto.categoryId !== menuItem.categoryId) {
      const category = await categoryRepository.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundError(MENU_ITEM_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    const data: any = {
      ...dto,
      ...(name && { name }),
      ...(name && { slug }),
      updatedBy: (currentUser.userId || currentUser.id),
    };

    if (data.variants) delete data.variants;
    if (data.modifierGroupIds) delete data.modifierGroupIds;

    let result;
    if (dto.variants && dto.variants.length > 0) {
      result = await menuItemRepository.updateWithVariantsAndRecipes(id, data, dto.variants, dto.modifierGroupIds, (currentUser.userId || currentUser.id));
    } else {
      result = await menuItemRepository.update(id, data);
    }
    
    await cacheService.delByPattern(`${CACHE_KEYS.MENU_ALL}*`);
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }

  async deleteMenuItem(id: number, currentUser: any) {
    const menuItem = await menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundError(MENU_ITEM_MESSAGES.NOT_FOUND);
    }

    const result = await menuItemRepository.softDelete(id, (currentUser.userId || currentUser.id));
    await cacheService.delByPattern(`${CACHE_KEYS.MENU_ALL}*`);
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }

  async restoreMenuItem(id: number, currentUser: any) {
    const menuItem = await menuItemRepository.findById(id, true);

    if (!menuItem) {
      throw new NotFoundError(MENU_ITEM_MESSAGES.NOT_FOUND);
    }

    if (!menuItem.deletedAt) {
      return menuItem;
    }

    const result = await menuItemRepository.restore(id, (currentUser.userId || currentUser.id));
    await cacheService.delByPattern(`${CACHE_KEYS.MENU_ALL}*`);
    await cacheService.delByPattern(`${CACHE_KEYS.CATEGORY_LIST}*`);
    return result;
  }
}

export default new MenuItemService();
