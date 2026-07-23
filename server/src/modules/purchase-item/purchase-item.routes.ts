import { Router } from "express";
import purchaseItemController from "./purchase-item.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createPurchaseItemSchema, updatePurchaseItemSchema } from "./purchase-item.validation";
import { ROLES } from "../../constants/roles";

// mergeParams: true allows us to access :purchaseId from the parent router in app.ts
const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createPurchaseItemSchema),
  purchaseItemController.create
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseItemController.findAll
);

router.get(
  "/:itemId",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseItemController.findOne
);

router.patch(
  "/:itemId",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updatePurchaseItemSchema),
  purchaseItemController.update
);

router.delete(
  "/:itemId",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseItemController.delete
);

export default router;
