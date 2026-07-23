import { printerRepository } from "../printer.repository";
import { buildKitchenTemplate } from "../templates/kitchen.template";
import { PrinterType, PreparationArea } from "@prisma/client";
import prisma from "../../../config/prisma";
import { NotFoundError } from "../../../errors";
import { printerQueue } from "../../../queue/queue.manager";

export class KitchenTicketService {
  async printTicket(orderId: number, copies: number = 1, userId?: number): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        orderItems: {
          where: { preparationArea: PreparationArea.KITCHEN }
        } 
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.orderItems.length === 0) {
      // Nothing to print for kitchen
      return;
    }

    const printer = await printerRepository.findDefault(PrinterType.KITCHEN);
    if (!printer) {
      throw new NotFoundError("No default kitchen printer configured");
    }

    const content = buildKitchenTemplate(order, order.orderItems);

    const job = await printerRepository.createPrintJob({
      printerId: printer.id,
      orderId: order.id,
      content,
      copies,
      printedBy: userId,
    });

    await printerQueue.add("print-kitchen-ticket", { printJobId: job.id });
  }
}

export const kitchenTicketService = new KitchenTicketService();
