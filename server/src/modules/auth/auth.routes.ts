import { Router } from "express";
import authController from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { loginSchema } from "./auth.validation";
import { authRateLimiter } from "../../infrastructure/redis/rate-limiter.middleware";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, (req: any, res: any) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  (req: any, res: any) => {
    res.json({
      success: true,
      message: "Welcome Admin",
      user: req.user,
    });
  }
);

export default router;