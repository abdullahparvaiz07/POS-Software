import { Router } from "express";
import categoryController from "./category.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import { ROLES } from "../../constants/roles";
import { cacheMiddleware } from "../../infrastructure/redis/cache.middleware";
import { CACHE_TTL, CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createCategorySchema),
  categoryController.create
);

router.get(
  "/",
  authenticate,
  cacheMiddleware(CACHE_TTL.CATEGORIES, CACHE_KEYS.CATEGORY_LIST),
  categoryController.findAll
);

router.get(
  "/:id",
  authenticate,
  cacheMiddleware(CACHE_TTL.CATEGORIES, CACHE_KEYS.CATEGORY_LIST),
  categoryController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateCategorySchema),
  categoryController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  categoryController.remove
);

router.patch(
  "/:id/restore",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  categoryController.restore
);

export default router;
