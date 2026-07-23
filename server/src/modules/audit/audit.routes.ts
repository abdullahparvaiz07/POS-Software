import { Router } from "express";
import auditController from "./audit.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticate);

// Only Admins can view audit logs
router.get("/", authorize(ROLES.ADMIN), auditController.getLogs);

export default router;
