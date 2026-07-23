import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "../infrastructure/redis/redis.client";
import { socketAuthMiddleware, AuthenticatedSocket } from "./socket.middleware";
import { registerGateway } from "./socket.gateway";

let io: Server;

export const initializeSocketServer = (httpServer: HttpServer): Server => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Setup Redis Adapter for horizontal scaling only if Redis is configured
  if (process.env.REDIS_URL) {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Apply authentication middleware
  io.use(socketAuthMiddleware as any);

  // Register gateway logic
  registerGateway(io);

  console.log("[Socket] WebSocket server initialized");

  return io;
};

export const getIoInstance = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized!");
  }
  return io;
};
