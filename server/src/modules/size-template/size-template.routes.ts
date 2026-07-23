import { Router } from "express";
import * as controller from "./size-template.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createSizeTemplateSchema, updateSizeTemplateSchema } from "./size-template.validation";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.findAll);
router.get("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.findById);

router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createSizeTemplateSchema),
  controller.create
);

router.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateSizeTemplateSchema),
  controller.update
);

router.delete("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), controller.deleteTemplate);

export default router;
