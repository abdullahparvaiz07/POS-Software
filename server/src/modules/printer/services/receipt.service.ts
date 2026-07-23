import { printerRepository } from "../printer.repository";
import { buildReceiptTemplate } from "../templates/receipt.template";
import { PrinterType } from "@prisma/client";
import prisma from "../../../config/prisma";
import { NotFoundError } from "../../../errors";
import { printerQueue } from "../../../queue/queue.manager";

export class ReceiptService {
  async printReceipt(orderId: number, copies: number = 1, userId?: number): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const settings = await prisma.settings.findFirst();

    const printer = await printerRepository.findDefault(PrinterType.RECEIPT);
    if (!printer) {
      throw new NotFoundError("No default receipt printer configured");
    }

    const content = buildReceiptTemplate(order, settings);

    const job = await printerRepository.createPrintJob({
      printerId: printer.id,
      orderId: order.id,
      content,
      copies,
      printedBy: userId,
    });

    await printerQueue.add("print-receipt", { printJobId: job.id });
  }

  async reprint(receiptId: string, copies: number = 1, userId?: number): Promise<void> {
    const job = await prisma.printJob.findFirst({
      where: { receiptId },
    });

    if (!job) {
      throw new NotFoundError("Receipt not found for reprint");
    }

    const newJob = await printerRepository.createPrintJob({
      printerId: job.printerId,
      orderId: job.orderId || undefined,
      receiptId,
      content: job.content,
      copies,
      printedBy: userId,
    });

    await printerQueue.add("reprint-receipt", { printJobId: newJob.id });
  }
}

export const receiptService = new ReceiptService();
