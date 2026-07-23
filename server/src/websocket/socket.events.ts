export const SOCKET_EVENTS = {
  // Orders
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_COMPLETED: "order.completed",
  ORDER_CANCELLED: "order.cancelled",

  // Kitchen
  KITCHEN_QUEUE_UPDATED: "kitchen.queue.updated",
  KITCHEN_ORDER_READY: "kitchen.order.ready",
  KITCHEN_ORDER_PREPARING: "kitchen.order.preparing",
  KITCHEN_ORDER_COMPLETED: "kitchen.order.completed",

  // Bar
  BAR_QUEUE_UPDATED: "bar.queue.updated",
  DRINK_READY: "drink.ready",

  // Inventory
  INVENTORY_LOW_STOCK: "inventory.low-stock",
  INVENTORY_UPDATED: "inventory.updated",
  INVENTORY_OUT_OF_STOCK: "inventory.out-of-stock",

  // Purchases
  PURCHASE_RECEIVED: "purchase.received",
  PURCHASE_COMPLETED: "purchase.completed",

  // Dashboard
  DASHBOARD_UPDATED: "dashboard.updated",
  SALES_UPDATED: "sales.updated",
  REVENUE_UPDATED: "revenue.updated",

  // Notifications
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_READ: "notification.read",

  // Presence / Heartbeat (Internal or Client-to-Server)
  PRESENCE_ONLINE: "presence.online",
  PRESENCE_OFFLINE: "presence.offline",
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
