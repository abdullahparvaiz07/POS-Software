import { Router } from "express";
import * as controller from "./modifier.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createModifierGroupSchema, updateModifierGroupSchema } from "./modifier.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.findAll);
router.get("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.findById);

router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createModifierGroupSchema),
  controller.create
);

router.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateModifierGroupSchema),
  controller.update
);

router.delete("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.deleteGroup);

export default router;
