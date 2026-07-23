import { Router } from "express";
import { printerController } from "./printer.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(authenticate);

// CRUD operations
router.get("/", asyncHandler(printerController.getAllPrinters));
router.get("/:id", asyncHandler(printerController.getPrinter));
router.post("/", authorize("PRINTER_MANAGE", "ADMIN", "MANAGER"), asyncHandler(printerController.createPrinter));
router.patch("/:id", authorize("PRINTER_MANAGE", "ADMIN", "MANAGER"), asyncHandler(printerController.updatePrinter));
router.delete("/:id", authorize("PRINTER_MANAGE", "ADMIN", "MANAGER"), asyncHandler(printerController.deletePrinter));

// Printer testing
router.post("/:id/test", asyncHandler(printerController.testPrinter));

// Printing tickets
router.post("/receipt/:orderId", asyncHandler(printerController.printReceipt));
router.post("/kitchen/:orderId", asyncHandler(printerController.printKitchenTicket));
router.post("/bar/:orderId", asyncHandler(printerController.printBarTicket));
router.post("/reprint/:receiptId", asyncHandler(printerController.reprint));

export { router as printerRoutes };
