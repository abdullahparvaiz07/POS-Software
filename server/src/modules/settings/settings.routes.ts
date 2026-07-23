import { Router } from "express";
import settingsController from "./settings.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { cacheMiddleware } from "../../infrastructure/redis/cache.middleware";
import { CACHE_TTL, CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

const router = Router();

router.use(authenticate);

// Settings accessible to all staff for system configuration read
router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR, ROLES.WAITER, ROLES.RIDER), cacheMiddleware(CACHE_TTL.SETTINGS, CACHE_KEYS.SETTINGS), settingsController.getSettings);
router.patch("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), settingsController.updateSettings);
router.put("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), settingsController.updateSettings);

export default router;