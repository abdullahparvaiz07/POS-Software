import { Router } from "express";
import menuItemController from "./menuItem.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createMenuItemSchema, updateMenuItemSchema } from "./menuItem.validation";
import { ROLES } from "../../constants/roles";
import { cacheMiddleware } from "../../infrastructure/redis/cache.middleware";
import { CACHE_TTL, CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createMenuItemSchema),
  menuItemController.create
);

router.get(
  "/",
  authenticate,
  cacheMiddleware(CACHE_TTL.MENU, CACHE_KEYS.MENU_ALL),
  menuItemController.findAll
);

router.get(
  "/:id",
  authenticate,
  cacheMiddleware(CACHE_TTL.MENU, CACHE_KEYS.MENU_ALL),
  menuItemController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateMenuItemSchema),
  menuItemController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  menuItemController.remove
);

router.patch(
  "/:id/restore",
  authenticate,
  authorize(ROLES.ADMIN),
  menuItemController.restore
);

export default router;
