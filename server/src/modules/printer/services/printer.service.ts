import { printerRepository } from "../printer.repository";
import { CreatePrinterInput, UpdatePrinterInput } from "../printer.types";
import { NotFoundError } from "../../../errors";
import { Printer } from "@prisma/client";

export class PrinterService {
  async getAllPrinters(): Promise<Printer[]> {
    return printerRepository.findAll();
  }

  async getPrinterById(id: number): Promise<Printer> {
    const printer = await printerRepository.findById(id);
    if (!printer) {
      throw new NotFoundError("Printer not found");
    }
    return printer;
  }

  async createPrinter(data: CreatePrinterInput): Promise<Printer> {
    return printerRepository.create(data);
  }

  async updatePrinter(id: number, data: UpdatePrinterInput): Promise<Printer> {
    await this.getPrinterById(id); // Ensure exists
    return printerRepository.update(id, data);
  }

  async deletePrinter(id: number): Promise<void> {
    await this.getPrinterById(id); // Ensure exists
    await printerRepository.delete(id);
  }

  async testPrinter(id: number, userId?: number): Promise<void> {
    const printer = await this.getPrinterById(id);
    
    const content = `TEST PRINT\nPrinter: ${printer.name}\nType: ${printer.type}\nStatus: ${printer.isActive ? 'Active' : 'Inactive'}\n--------------------------------\nSuccess`;
    
    await printerRepository.createPrintJob({
      printerId: printer.id,
      content,
      status: "PENDING",
      copies: 1,
      printedBy: userId,
    });
  }
}

export const printerService = new PrinterService();
