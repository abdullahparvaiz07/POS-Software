import { Router } from "express";
import kitchenController from "./kitchen.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/queue", authorize(ROLES.CHEF, ROLES.KITCHEN, ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER, ROLES.WAITER), kitchenController.getQueue);
router.patch("/queue/:id/status", authorize(ROLES.CHEF, ROLES.KITCHEN, ROLES.MANAGER, ROLES.ADMIN), kitchenController.updateStatus);
router.patch("/queue/:id/assign", authorize(ROLES.CHEF, ROLES.KITCHEN, ROLES.MANAGER, ROLES.ADMIN), kitchenController.assignStaff);

export default router;