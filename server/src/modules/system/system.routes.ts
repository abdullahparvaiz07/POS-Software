import { Router } from "express";
import systemController from "./system.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

// Protect system routes
router.use(authenticate);

router.get(
  "/redis-health",
  authorize(ROLES.ADMIN),
  systemController.getRedisHealth
);

router.get(
  "/queues",
  authorize(ROLES.ADMIN),
  systemController.getQueueStats
);

export { router as systemRoutes };
