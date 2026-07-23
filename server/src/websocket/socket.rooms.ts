export const SOCKET_ROOMS = {
  CASHIER: "cashier",
  KITCHEN: "kitchen",
  BAR: "bar",
  MANAGER: "manager",
  INVENTORY: "inventory",
  DASHBOARD: "dashboard",
  ADMIN: "admin",
} as const;

export type SocketRoom = typeof SOCKET_ROOMS[keyof typeof SOCKET_ROOMS];
