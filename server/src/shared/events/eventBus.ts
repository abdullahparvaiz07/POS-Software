import { EventEmitter } from "events";

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

// Optionally, centralize event names
export const EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_READY: "order.ready",
  ORDER_DELIVERED: "order.delivered",
  ORDER_PAID: "order.paid",
  INVENTORY_LOW_STOCK: "inventory.lowStock",
  INVENTORY_OUT_OF_STOCK: "inventory.outOfStock",
  INVENTORY_EXPIRY_ALERT: "inventory.expiryAlert",
  PURCHASE_RECEIVED: "purchase.received",
  SECURITY_FAILED_LOGIN: "security.failedLogin",
  SETTINGS_CHANGED: "settings.changed",
};
