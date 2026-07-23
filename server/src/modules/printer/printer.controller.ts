import { Request, Response } from "express";
import { printerService } from "./services/printer.service";
import { receiptService } from "./services/receipt.service";
import { kitchenTicketService } from "./services/kitchen-ticket.service";
import { barTicketService } from "./services/bar-ticket.service";
import { 
  createPrinterSchema, 
  updatePrinterSchema, 
  printReceiptSchema, 
  printKitchenTicketSchema, 
  printBarTicketSchema, 
  reprintSchema 
} from "./printer.validation";

export class PrinterController {
  async getAllPrinters(req: Request, res: Response) {
    const printers = await printerService.getAllPrinters();
    res.status(200).json({ success: true, data: printers });
  }

  async getPrinter(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    const printer = await printerService.getPrinterById(id);
    res.status(200).json({ success: true, data: printer });
  }

  async createPrinter(req: Request, res: Response) {
    const validatedData = createPrinterSchema.parse({ body: req.body });
    const printer = await printerService.createPrinter(validatedData.body as any);
    res.status(201).json({ success: true, data: printer });
  }

  async updatePrinter(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    const validatedData = updatePrinterSchema.parse({ body: req.body });
    const printer = await printerService.updatePrinter(id, validatedData.body as any);
    res.status(200).json({ success: true, data: printer });
  }

  async deletePrinter(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    await printerService.deletePrinter(id);
    res.status(200).json({ success: true, message: "Printer deleted successfully" });
  }

  async testPrinter(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    await printerService.testPrinter(id, req.user?.id);
    res.status(200).json({ success: true, message: "Test print queued successfully" });
  }

  async printReceipt(req: Request, res: Response) {
    const { params } = printReceiptSchema.parse({ params: req.params });
    await receiptService.printReceipt(params.orderId, 1, req.user?.id);
    res.status(200).json({ success: true, message: "Receipt print queued successfully" });
  }

  async printKitchenTicket(req: Request, res: Response) {
    const { params } = printKitchenTicketSchema.parse({ params: req.params });
    await kitchenTicketService.printTicket(params.orderId, 1, req.user?.id);
    res.status(200).json({ success: true, message: "Kitchen ticket queued successfully" });
  }

  async printBarTicket(req: Request, res: Response) {
    const { params } = printBarTicketSchema.parse({ params: req.params });
    await barTicketService.printTicket(params.orderId, 1, req.user?.id);
    res.status(200).json({ success: true, message: "Bar ticket queued successfully" });
  }

  async reprint(req: Request, res: Response) {
    const { params } = reprintSchema.parse({ params: req.params });
    await receiptService.reprint(params.receiptId, 1, req.user?.id);
    res.status(200).json({ success: true, message: "Reprint queued successfully" });
  }
}

export const printerController = new PrinterController();
