import { PrinterType, PrintJobStatus } from "@prisma/client";

export interface CreatePrinterInput {
  name: string;
  type: PrinterType;
  ipAddress?: string;
  port?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdatePrinterInput {
  name?: string;
  type?: PrinterType;
  ipAddress?: string;
  port?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface PrintReceiptInput {
  orderId: number;
  copies?: number;
}

export interface PrintKitchenTicketInput {
  orderId: number;
  copies?: number;
}

export interface PrintBarTicketInput {
  orderId: number;
  copies?: number;
}

export interface ReprintInput {
  receiptId: string;
  copies?: number;
}
