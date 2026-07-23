import { Router } from "express";
import barController from "./bar.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/queue", authorize(ROLES.BARTENDER, ROLES.BAR, ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER, ROLES.WAITER), barController.getQueue);
router.patch("/queue/:id/status", authorize(ROLES.BARTENDER, ROLES.BAR, ROLES.MANAGER, ROLES.ADMIN), barController.updateStatus);
router.patch("/queue/:id/assign", authorize(ROLES.BARTENDER, ROLES.BAR, ROLES.MANAGER, ROLES.ADMIN), barController.assignStaff);

export default router;