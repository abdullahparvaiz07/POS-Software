import { Router } from "express";
import ingredientController from "./ingredient.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createIngredientSchema, updateIngredientSchema } from "./ingredient.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createIngredientSchema),
  ingredientController.create
);

router.get(
  "/low-stock",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.BARTENDER),
  ingredientController.findLowStock
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.BARTENDER),
  ingredientController.findAll
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.BARTENDER),
  ingredientController.findOne
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateIngredientSchema),
  ingredientController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  ingredientController.delete
);

export default router;
