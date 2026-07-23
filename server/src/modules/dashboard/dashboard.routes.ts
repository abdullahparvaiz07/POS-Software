import { Router } from "express";
import dashboardController from "./dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { cacheMiddleware } from "../../infrastructure/redis/cache.middleware";
import { CACHE_TTL, CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  cacheMiddleware(CACHE_TTL.DASHBOARD, CACHE_KEYS.DASHBOARD_SUMMARY),
  dashboardController.getDashboard
);

export default router;