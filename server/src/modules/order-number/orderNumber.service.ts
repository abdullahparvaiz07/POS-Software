import { Prisma } from "@prisma/client";
import orderNumberRepository from "./orderNumber.repository";
import { ORDER_NUMBER } from "./orderNumber.constants";
import { GenerateOrderNumberOptions, GeneratedOrderNumber } from "./orderNumber.types";

class OrderNumberService {
  async generate(tx: Prisma.TransactionClient, options?: GenerateOrderNumberOptions): Promise<GeneratedOrderNumber> {
    const businessDate = options?.businessDate ?? this.getTodayCounter();
    
    // Normalize to start of day for strict daily bucketing
    businessDate.setUTCHours(0, 0, 0, 0);

    const sequence = await orderNumberRepository.getNextSequence(tx, businessDate);
    const orderNumber = this.buildOrderNumber(businessDate, sequence);

    return {
      orderNumber,
      sequence,
      businessDate,
    };
  }

  private getTodayCounter(): Date {
    return new Date();
  }

  private formatDate(date: Date): string {
    const yyyy = date.getUTCFullYear().toString();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`; 
  }

  private padSequence(sequence: number): string {
    return String(sequence).padStart(ORDER_NUMBER.SEQUENCE_LENGTH, '0');
  }

  private buildOrderNumber(date: Date, sequence: number): string {
    const prefix = process.env.ORDER_PREFIX || ORDER_NUMBER.PREFIX;
    const dateStr = this.formatDate(date);
    const sequenceStr = this.padSequence(sequence);
    
    return `${prefix}-${dateStr}-${sequenceStr}`;
  }
}

export default new OrderNumberService();
