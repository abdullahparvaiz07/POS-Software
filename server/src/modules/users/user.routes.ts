import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

// All staff can view user list for staff assignment
router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR, ROLES.WAITER), userController.getAllUsers);
router.get("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR, ROLES.WAITER), userController.getUserById);

// Admin, Manager, Cashier can manage users
router.post("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), userController.createUser);
router.patch("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), userController.updateUser);
router.delete("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), userController.deleteUser);
router.patch("/:id/restore", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), userController.restoreUser);

export default router;

