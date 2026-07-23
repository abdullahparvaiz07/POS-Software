import { Router } from "express";
import unitController from "./unit.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createUnitSchema, updateUnitSchema } from "./unit.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createUnitSchema),
  unitController.create
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.BARTENDER),
  unitController.findAll
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.BARTENDER),
  unitController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateUnitSchema),
  unitController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  unitController.delete
);

export default router;
