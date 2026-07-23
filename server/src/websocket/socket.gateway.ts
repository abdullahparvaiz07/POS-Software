import { Server } from "socket.io";
import { AuthenticatedSocket } from "./socket.middleware";
import { SOCKET_ROOMS } from "./socket.rooms";
import { ROLES } from "../constants/roles";
import { cacheService } from "../infrastructure/redis/cache.service";

export const registerGateway = (io: Server) => {
  io.on("connection", async (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) {
      return socket.disconnect(true);
    }

    console.log(`[Socket] User connected: ${user.userId} (Socket: ${socket.id})`);

    // Track online presence in Redis
    await cacheService.set(`presence:online:${user.userId}`, socket.id, 86400); // 24hr TTL

    // Join rooms based on user roles
    if (user.roles.includes(ROLES.CASHIER)) {
      socket.join(SOCKET_ROOMS.CASHIER);
    }
    
    if (user.roles.includes(ROLES.CHEF) || user.roles.includes(ROLES.KITCHEN) || user.roles.includes("KITCHEN")) {
      socket.join(SOCKET_ROOMS.KITCHEN);
    }
    
    if (user.roles.includes(ROLES.BARTENDER) || user.roles.includes(ROLES.BAR) || user.roles.includes("BAR")) {
      socket.join(SOCKET_ROOMS.BAR);
    }
    
    if (user.roles.includes(ROLES.MANAGER)) {
      socket.join(SOCKET_ROOMS.MANAGER);
      socket.join(SOCKET_ROOMS.DASHBOARD);
      socket.join(SOCKET_ROOMS.INVENTORY);
      socket.join(SOCKET_ROOMS.KITCHEN);
      socket.join(SOCKET_ROOMS.BAR);
    }
    
    if (user.roles.includes(ROLES.ADMIN)) {
      socket.join(SOCKET_ROOMS.ADMIN);
      socket.join(SOCKET_ROOMS.DASHBOARD);
      socket.join(SOCKET_ROOMS.MANAGER);
      socket.join(SOCKET_ROOMS.INVENTORY);
      socket.join(SOCKET_ROOMS.KITCHEN);
      socket.join(SOCKET_ROOMS.BAR);
    }

    // Handle explicit disconnect
    socket.on("disconnect", async (reason) => {
      console.log(`[Socket] User disconnected: ${user.userId} (${reason})`);
      await cacheService.del(`presence:online:${user.userId}`);
    });
  });
};
