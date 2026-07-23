import { Router } from "express";
import { metricsService } from "./metrics.service";

const router = Router();

router.get("/", async (req, res) => {
  res.set("Content-Type", "text/plain");
  const metrics = await metricsService.getMetrics();
  res.send(metrics);
});

export { router as metricsRoutes };
