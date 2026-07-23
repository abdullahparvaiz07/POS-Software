import { Request, Response, NextFunction } from "express";
import authService from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // The token is available due to the authenticate middleware
      // We will blacklist the token via cacheService
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // Standard token expiry is roughly 1 day
        const expiresInSeconds = 24 * 60 * 60;
        const { cacheService } = await import("../../infrastructure/redis/cache.service");
        await cacheService.blacklistToken(token, expiresInSeconds);
      }

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Successfully logged out",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();