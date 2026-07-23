import { Request, Response, NextFunction } from "express";
import authRepository from "../modules/auth/auth.repository";
import { verifyToken } from "../utils/jwt";
import { cacheService } from "../infrastructure/redis/cache.service";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is missing.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authHeader.split(" ")[1];

    const isBlacklisted = await cacheService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid.",
      });
    }

    const payload = verifyToken(token);

    const user = await authRepository.findUserById(payload.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.",
      });
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      roles: user.userRoles.map((r) => r.role.name),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}