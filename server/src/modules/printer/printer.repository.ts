import prisma from "../../config/prisma";
import { PrinterType, PrintJobStatus, Printer, PrintJob } from "@prisma/client";
import { CreatePrinterInput, UpdatePrinterInput } from "./printer.types";

export class PrinterRepository {
  async findAll(): Promise<Printer[]> {
    return prisma.printer.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number): Promise<Printer | null> {
    return prisma.printer.findUnique({
      where: { id },
    });
  }

  async findDefault(type: PrinterType): Promise<Printer | null> {
    return prisma.printer.findFirst({
      where: { type, isDefault: true, isActive: true },
    });
  }

  async findByType(type: PrinterType): Promise<Printer[]> {
    return prisma.printer.findMany({
      where: { type, isActive: true },
    });
  }

  async create(data: CreatePrinterInput): Promise<Printer> {
    return prisma.$transaction(async (tx: any) => {
      if (data.isDefault) {
        await tx.printer.updateMany({
          where: { type: data.type },
          data: { isDefault: false },
        });
      }

      return tx.printer.create({
        data,
      });
    });
  }

  async update(id: number, data: UpdatePrinterInput): Promise<Printer> {
    return prisma.$transaction(async (tx: any) => {
      if (data.isDefault) {
        const printer = await tx.printer.findUnique({ where: { id } });
        if (printer) {
          await tx.printer.updateMany({
            where: { type: data.type || printer.type },
            data: { isDefault: false },
          });
        }
      }

      return tx.printer.update({
        where: { id },
        data,
      });
    });
  }

  async delete(id: number): Promise<Printer> {
    return prisma.printer.delete({
      where: { id },
    });
  }

  async createPrintJob(data: {
    printerId: number;
    orderId?: number;
    receiptId?: string;
    content: string;
    status?: PrintJobStatus;
    copies?: number;
    printedBy?: number;
  }): Promise<PrintJob> {
    return prisma.printJob.create({
      data,
    });
  }

  async updatePrintJobStatus(
    id: number,
    status: PrintJobStatus,
    errorMessage?: string
  ): Promise<PrintJob> {
    return prisma.printJob.update({
      where: { id },
      data: { status, errorMessage, printedAt: status === "COMPLETED" ? new Date() : null },
    });
  }

  async getPendingPrintJobs(): Promise<PrintJob[]> {
    return prisma.printJob.findMany({
      where: { status: "PENDING" },
      include: { printer: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findPrintJobById(id: number): Promise<(PrintJob & { printer: Printer | null }) | null> {
    return prisma.printJob.findUnique({
      where: { id },
      include: { printer: true },
    });
  }
}

export const printerRepository = new PrinterRepository();
