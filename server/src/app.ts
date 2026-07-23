import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { healthRoutes } from "./health/health.routes";
import { metricsRoutes } from "./metrics/metrics.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users";
import rolesRoutes from "./modules/roles";
import categoryRoutes from "./modules/category";
import { sizeTemplateRoutes } from "./modules/size-template";
import { modifierRoutes } from "./modules/modifier";
import menuItemRoutes from "./modules/menu-item";
import orderRoutes from "./modules/order";
import { unitRoutes } from "./modules/unit";
import { ingredientRoutes } from "./modules/ingredient";
import { supplierRoutes } from "./modules/supplier";
import { purchaseRoutes } from "./modules/purchase";
import { purchaseItemRoutes } from "./modules/purchase-item";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger, correlationIdMiddleware } from "./logging/request.logger";
import { errorLogger } from "./logging/error.logger";
import { auditMiddleware } from "./middleware/audit.middleware";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import salesReportRoutes from "./modules/reports/sales/sales-report.routes";
import inventoryReportRoutes from "./modules/reports/inventory/inventory-report.routes";
import purchaseReportRoutes from "./modules/reports/purchases/purchase-report.routes";
import financialReportRoutes from "./modules/reports/financial/financial-report.routes";
import kitchenReportRoutes from "./modules/reports/kitchen/kitchen-report.routes";
import kitchenRoutes from "./modules/kitchen/kitchen.routes";
import barRoutes from "./modules/bar/bar.routes";
import auditRoutes from "./modules/audit/audit.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import { setupNotificationListeners } from "./modules/notification/notification.listener";
import { printerRoutes } from "./modules/printer/printer.routes";
import { initializePrinterListeners } from "./modules/printer/printer.listener";
import { backupRoutes } from "./modules/backup";
import { systemRoutes } from "./modules/system/system.routes";
import { globalRateLimiter } from "./infrastructure/redis/rate-limiter.middleware";
import promBundle from "express-prom-bundle";

// Initialize event listeners
setupNotificationListeners();
initializePrinterListeners();

const app = express();

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  promClient: {
    collectDefaultMetrics: {},
  },
});
app.use(metricsMiddleware);

const isProduction = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: isProduction,
  })
);

const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";

app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(correlationIdMiddleware);
app.use(requestLogger);
app.use(cookieParser());
app.use(globalRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/metrics", metricsRoutes);

// Generic Audit Logging for all v1 routes
app.use("/api/v1", auditMiddleware("System"));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/roles", rolesRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/size-templates", sizeTemplateRoutes);
app.use("/api/v1/modifiers", modifierRoutes);
app.use("/api/v1/menu-items", menuItemRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/units", unitRoutes);
app.use("/api/v1/ingredients", ingredientRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/purchases/:purchaseId/items", purchaseItemRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/reports/sales", salesReportRoutes);
app.use("/api/v1/reports/inventory", inventoryReportRoutes);
app.use("/api/v1/reports/purchases", purchaseReportRoutes);
app.use("/api/v1/reports/financial", financialReportRoutes);
app.use("/api/v1/reports/kitchen", kitchenReportRoutes);
app.use("/api/v1/kitchen", kitchenRoutes);
app.use("/api/v1/bar", barRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/printers", printerRoutes);
app.use("/api/v1/backups", backupRoutes);
app.use("/api/v1/system", systemRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// Global error handler
app.use(errorLogger);
app.use(errorHandler);

export default app;