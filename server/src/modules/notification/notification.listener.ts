import { eventBus, EVENTS } from "../../shared/events/eventBus";
import notificationService from "./services/notification.service";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import prisma from "../../config/prisma";
import { NotificationType, NotificationChannel } from "@prisma/client";

const compileTemplate = (templateName: string, data: any) => {
  const filePath = path.join(__dirname, "templates", `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, "utf-8");
  const template = Handlebars.compile(source);
  return template(data);
};

// Listeners
eventBus.on(EVENTS.ORDER_CREATED, async (data: any) => {
  try {
    const message = compileTemplate("order-created", {
      orderNumber: data.orderNumber,
      orderType: data.type,
      currency: "PKR",
      totalAmount: data.grandTotal,
      posUrl: process.env.POS_URL || "http://localhost:3000"
    });

    // Determine channels from system settings or user preferences
    // For now, hardcode IN_APP and EMAIL to Managers
    const channels: NotificationChannel[] = ["IN_APP"];
    
    // Find a manager to notify (in real app, use user preference table)
    const managers = await prisma.user.findMany({ where: { userRoles: { some: { role: { name: "MANAGER" } } } } });

    for (const manager of managers) {
      await notificationService.send({
        title: "New Order Received",
        message,
        type: "ORDER",
        channels,
        recipientId: manager.id,
        contactInfo: { email: manager.email || undefined }
      });
    }
  } catch (error) {
    console.error("Failed to process ORDER_CREATED event", error);
  }
});

eventBus.on(EVENTS.INVENTORY_LOW_STOCK, async (data: any) => {
  try {
    const message = compileTemplate("low-stock", {
      ingredientName: data.ingredientName,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      unit: data.unitSymbol
    });

    const channels: NotificationChannel[] = ["IN_APP", "EMAIL"];
    
    const managers = await prisma.user.findMany({ where: { userRoles: { some: { role: { name: "MANAGER" } } } } });

    for (const manager of managers) {
      await notificationService.send({
        title: "Low Stock Alert",
        message,
        type: "INVENTORY",
        channels,
        recipientId: manager.id,
        contactInfo: { email: manager.email || undefined }
      });
    }
  } catch (error) {
    console.error("Failed to process INVENTORY_LOW_STOCK event", error);
  }
});

export const setupNotificationListeners = () => {
  console.log("Notification listeners initialized.");
};
