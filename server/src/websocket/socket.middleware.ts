import { Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import authRepository from "../modules/auth/auth.repository";
import { cacheService } from "../infrastructure/redis/cache.service";

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: number;
    phone: string;
    roles: string[];
  };
}

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    // Check if token is blacklisted
    const isBlacklisted = await cacheService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next(new Error("Authentication error: Session expired or invalid"));
    }

    // Verify JWT
    const payload = verifyToken(token);

    // Fetch user and roles
    const user = await authRepository.findUserById(payload.id);
    
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    if (user.status !== "ACTIVE") {
      return next(new Error("Authentication error: Account is inactive"));
    }

    // Attach user to socket
    socket.user = {
      userId: user.id,
      phone: user.phone,
      roles: user.userRoles.map((r) => r.role.name),
    };

    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};
