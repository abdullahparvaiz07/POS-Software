import { Router } from "express";
import supplierController from "./supplier.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createSupplierSchema, updateSupplierSchema } from "./supplier.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createSupplierSchema),
  supplierController.create
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF),
  supplierController.findAll
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF),
  supplierController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateSupplierSchema),
  supplierController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  supplierController.delete
);

export default router;
