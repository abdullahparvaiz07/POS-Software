import { Router } from "express";
import { healthController } from "./health.controller";

const router = Router();

router.get("/", healthController.getSystemHealth);
router.get("/database", healthController.getDatabaseHealth);
router.get("/redis", healthController.getRedisHealth);
router.get("/queues", healthController.getQueuesHealth);
router.get("/printers", healthController.getPrintersHealth);

export { router as healthRoutes };
