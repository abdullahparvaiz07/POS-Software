import { Router } from "express";
import purchaseController from "./purchase.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createPurchaseSchema, updatePurchaseSchema } from "./purchase.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createPurchaseSchema),
  purchaseController.create
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseController.findAll
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updatePurchaseSchema),
  purchaseController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseController.delete
);

router.post(
  "/:id/receive",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  purchaseController.receive
);

export default router;
