import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

class MenuItemRepository {
  async createWithVariants(data: Prisma.MenuItemCreateInput | Prisma.MenuItemUncheckedCreateInput) {
    return prisma.menuItem.create({
      data,
      include: {
        category: true,
        variants: true,
      },
    });
  }

  async releaseSoftDeletedUniqueKeys(name: string, slug: string, sku?: string) {
    const timestamp = Date.now();
    const conflicts = await prisma.menuItem.findMany({
      where: {
        deletedAt: { not: null },
        OR: [
          { name },
          { slug },
          ...(sku ? [{ sku }] : []),
        ],
      },
    });

    for (const item of conflicts) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          name: item.name.includes('_deleted_') ? item.name : `${item.name}_deleted_${timestamp}`,
          slug: item.slug.includes('_deleted_') ? item.slug : `${item.slug}_deleted_${timestamp}`,
          sku: item.sku ? (item.sku.includes('_deleted_') ? item.sku : `${item.sku}_deleted_${timestamp}`) : null,
        },
      });
    }
  }

  async createWithVariantsAndRecipes(
    data: Prisma.MenuItemCreateInput | Prisma.MenuItemUncheckedCreateInput,
    variantsInput: any[],
    modifierGroupIds: number[] | undefined,
    userId: number
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the base menu item
      const menuItem = await tx.menuItem.create({
        data,
      });

      // 2. Link modifier groups
      if (modifierGroupIds && modifierGroupIds.length > 0) {
        await tx.menuItemModifierGroup.createMany({
          data: modifierGroupIds.map((groupId, index) => ({
            menuItemId: menuItem.id,
            modifierGroupId: groupId,
            displayOrder: index
          }))
        });
      }

      // 3. Create variants and their recipes
      for (const v of variantsInput) {
        let recipeId = null;

        // If a recipe is provided, create it first
        if (v.recipe && v.recipe.recipeItems && v.recipe.recipeItems.length > 0) {
          const recipe = await tx.recipe.create({
            data: {
              menuItemId: menuItem.id,
              createdBy: userId,
              updatedBy: userId,
              recipeItems: {
                create: v.recipe.recipeItems.map((item: any) => ({
                  ingredientId: item.ingredientId,
                  quantity: item.quantity,
                })),
              },
            },
          });
          recipeId = recipe.id;
        }

        // Create the variant linked to the recipe
        await tx.menuVariant.create({
          data: {
            menuItemId: menuItem.id,
            name: v.name.trim(),
            price: v.price,
            displayOrder: v.displayOrder ?? 0,
            isDefault: v.isDefault ?? false,
            isAvailable: v.isAvailable ?? true,
            image: v.image,
            barcode: v.barcode,
            sku: v.sku,
            preparationTime: v.preparationTime,
            recipeId,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Return the full object
      return tx.menuItem.findUnique({
        where: { id: menuItem.id },
        include: {
          category: true,
          variants: true,
        },
      });
    });
  }

  async findById(id: number, includeDeleted = false) {
    return prisma.menuItem.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        category: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: true }
            }
          },
          orderBy: { displayOrder: "asc" }
        },
        variants: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });
  }

  async findByName(name: string, includeDeleted = false) {
    return prisma.menuItem.findFirst({
      where: {
        name,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async existsByName(name: string) {
    const count = await prisma.menuItem.count({
      where: {
        name,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async findAll(args: Prisma.MenuItemFindManyArgs) {
    return prisma.menuItem.findMany({
      ...args,
      include: {
        category: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: true }
            }
          },
          orderBy: { displayOrder: "asc" }
        },
        variants: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });
  }

  async count(where?: Prisma.MenuItemWhereInput) {
    return prisma.menuItem.count({ where });
  }

  async update(id: number, data: Prisma.MenuItemUpdateInput | Prisma.MenuItemUncheckedUpdateInput) {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async updateWithVariantsAndRecipes(
    id: number,
    data: Prisma.MenuItemUpdateInput | Prisma.MenuItemUncheckedUpdateInput,
    variantsInput: any[],
    modifierGroupIds: number[] | undefined,
    userId: number
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Update the base menu item
      await tx.menuItem.update({
        where: { id },
        data,
      });

      // 1.5 Update modifier groups if provided
      if (modifierGroupIds !== undefined) {
        await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId: id } });
        if (modifierGroupIds.length > 0) {
          await tx.menuItemModifierGroup.createMany({
            data: modifierGroupIds.map((groupId, index) => ({
              menuItemId: id,
              modifierGroupId: groupId,
              displayOrder: index
            }))
          });
        }
      }

      // 2. Handle Variants
      const existingVariants = await tx.menuVariant.findMany({ where: { menuItemId: id } });
      const existingIds = existingVariants.map(v => v.id);
      
      const inputIds = variantsInput.map(v => v.id).filter(Boolean);
      const idsToSoftDelete = existingIds.filter(vId => !inputIds.includes(vId));

      if (idsToSoftDelete.length > 0) {
        await tx.menuVariant.updateMany({
          where: { id: { in: idsToSoftDelete } },
          data: { deletedAt: new Date(), isAvailable: false, updatedBy: userId }
        });
      }

      // 3. Create or Update variants
      for (const v of variantsInput) {
        let recipeId = v.recipeId || null;

        if (v.recipe && v.recipe.recipeItems && v.recipe.recipeItems.length > 0) {
          const recipe = await tx.recipe.create({
            data: {
              menuItemId: id,
              createdBy: userId,
              updatedBy: userId,
              recipeItems: {
                create: v.recipe.recipeItems.map((item: any) => ({
                  ingredientId: item.ingredientId,
                  quantity: item.quantity,
                })),
              },
            },
          });
          recipeId = recipe.id;
        }

        const variantData = {
          menuItemId: id,
          name: v.name.trim(),
          price: v.price,
          displayOrder: v.displayOrder ?? 0,
          isDefault: v.isDefault ?? false,
          isAvailable: v.isAvailable ?? true,
          image: v.image,
          barcode: v.barcode,
          sku: v.sku,
          preparationTime: v.preparationTime,
          recipeId,
          updatedBy: userId,
        };

        if (v.id && existingIds.includes(v.id)) {
          await tx.menuVariant.update({
            where: { id: v.id },
            data: variantData,
          });
        } else {
          await tx.menuVariant.create({
            data: {
              ...variantData,
              createdBy: userId,
            },
          });
        }
      }

      // Return the full object
      return tx.menuItem.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
        },
      });
    });
  }

  async softDelete(id: number, updatedBy: number) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) return null;
    const timestamp = Date.now();
    const name = item.name.includes('_deleted_') ? item.name : `${item.name}_deleted_${timestamp}`;
    const slug = item.slug.includes('_deleted_') ? item.slug : `${item.slug}_deleted_${timestamp}`;
    const sku = item.sku ? (item.sku.includes('_deleted_') ? item.sku : `${item.sku}_deleted_${timestamp}`) : null;

    return prisma.menuItem.update({
      where: { id },
      data: {
        name,
        slug,
        sku,
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  async restore(id: number, updatedBy: number) {
    return prisma.menuItem.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedBy,
      },
    });
  }
}

export default new MenuItemRepository();
