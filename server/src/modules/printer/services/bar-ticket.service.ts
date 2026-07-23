import { printerRepository } from "../printer.repository";
import { buildBarTemplate } from "../templates/bar.template";
import { PrinterType, PreparationArea } from "@prisma/client";
import prisma from "../../../config/prisma";
import { NotFoundError } from "../../../errors";
import { printerQueue } from "../../../queue/queue.manager";

export class BarTicketService {
  async printTicket(orderId: number, copies: number = 1, userId?: number): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        orderItems: {
          where: { preparationArea: PreparationArea.BAR }
        } 
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.orderItems.length === 0) {
      // Nothing to print for bar
      return;
    }

    const printer = await printerRepository.findDefault(PrinterType.BAR);
    if (!printer) {
      throw new NotFoundError("No default bar printer configured");
    }

    const content = buildBarTemplate(order, order.orderItems);

    const job = await printerRepository.createPrintJob({
      printerId: printer.id,
      orderId: order.id,
      content,
      copies,
      printedBy: userId,
    });

    await printerQueue.add("print-bar-ticket", { printJobId: job.id });
  }
}

export const barTicketService = new BarTicketService();
