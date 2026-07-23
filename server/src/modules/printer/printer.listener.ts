import { eventBus, EVENTS } from "../../shared/events/eventBus";
import { receiptService } from "./services/receipt.service";
import { kitchenTicketService } from "./services/kitchen-ticket.service";
import { barTicketService } from "./services/bar-ticket.service";

export const initializePrinterListeners = () => {
  eventBus.on(EVENTS.ORDER_PAID, async (data: { orderId: number, userId?: number }) => {
    try {
      console.log(`[PrinterListener] Auto-printing for order ${data.orderId}`);
      
      // Attempt to queue receipt
      await receiptService.printReceipt(data.orderId, 1, data.userId).catch(err => {
        console.error("[PrinterListener] Failed to queue receipt:", err.message);
      });

      // Attempt to queue kitchen KOT
      await kitchenTicketService.printTicket(data.orderId, 1, data.userId).catch(err => {
        console.error("[PrinterListener] Failed to queue kitchen ticket:", err.message);
      });

      // Attempt to queue bar BOT
      await barTicketService.printTicket(data.orderId, 1, data.userId).catch(err => {
        console.error("[PrinterListener] Failed to queue bar ticket:", err.message);
      });

    } catch (error) {
      console.error("[PrinterListener] Error handling auto-print event:", error);
    }
  });

  console.log("[PrinterListener] Initialized");
};
