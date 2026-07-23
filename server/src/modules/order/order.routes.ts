import { Router } from "express";
import orderController from "./order.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { validate } from "../../middleware/validation.middleware";
import { 
  createOrderSchema, 
  updateStatusSchema, 
  markPaidSchema, 
  assignStaffSchema 
} from "./order.validation";

const router = Router();

// Protect all routes
router.use(authenticate);

// Create Order
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  validate(createOrderSchema),
  orderController.create
);

// View Orders
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR, ROLES.RIDER),
  orderController.findAll
);

// Get Eligible Staff for Role
router.get(
  "/eligible-staff",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR),
  orderController.getEligibleStaff
);

router.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER, ROLES.CHEF, ROLES.KITCHEN, ROLES.BARTENDER, ROLES.BAR, ROLES.RIDER),
  orderController.findOne
);

// Assign Staff
router.patch(
  "/:id/assign-staff",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  validate(assignStaffSchema),
  orderController.assignStaff
);

router.patch(
  "/:id/assign",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  validate(assignStaffSchema),
  orderController.assignStaff
);

// Mark Paid
router.patch(
  "/:id/payment",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  validate(markPaidSchema),
  orderController.markPaid
);

// Cancel Order
router.patch(
  "/:id/cancel",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  orderController.cancel
);

// Complete Order
router.post(
  "/:id/complete",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  orderController.complete
);

export default router;
