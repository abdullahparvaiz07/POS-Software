import { getIoInstance } from "./socket.server";
import { SocketEvent } from "./socket.events";
import { SocketRoom } from "./socket.rooms";
import { cacheService } from "../infrastructure/redis/cache.service";

export class SocketService {
  /**
   * Emit an event to a specific room
   */
  emitToRoom(room: SocketRoom, event: SocketEvent, payload: any) {
    try {
      const io = getIoInstance();
      io.to(room).emit(event, payload);
    } catch (error) {
      console.error(`[SocketService] Failed to emit to room ${room}:`, error);
    }
  }

  /**
   * Broadcast an event to all connected clients
   */
  broadcast(event: SocketEvent, payload: any) {
    try {
      const io = getIoInstance();
      io.emit(event, payload);
    } catch (error) {
      console.error("[SocketService] Failed to broadcast event:", error);
    }
  }

  /**
   * Send a targeted event to a specific user (if they are online)
   */
  async sendToUser(userId: number, event: SocketEvent, payload: any) {
    try {
      const socketId = await cacheService.get<string>(`presence:online:${userId}`);
      if (socketId) {
        const io = getIoInstance();
        io.to(socketId).emit(event, payload);
      }
    } catch (error) {
      console.error(`[SocketService] Failed to send to user ${userId}:`, error);
    }
  }

  /**
   * Disconnect a specific user
   */
  async disconnectUser(userId: number) {
    try {
      const socketId = await cacheService.get<string>(`presence:online:${userId}`);
      if (socketId) {
        const io = getIoInstance();
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    } catch (error) {
      console.error(`[SocketService] Failed to disconnect user ${userId}:`, error);
    }
  }
}

export const socketService = new SocketService();
