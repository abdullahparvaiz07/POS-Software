import { Prisma } from "@prisma/client";

class OrderNumberRepository {
  async getNextSequence(tx: Prisma.TransactionClient, businessDate: Date): Promise<number> {
    // Upsert guarantees atomic creation and increment without race conditions
    const counter = await tx.orderCounter.upsert({
      where: { businessDate },
      update: {
        lastSequence: {
          increment: 1,
        },
      },
      create: {
        businessDate,
        lastSequence: 1,
      },
    });

    return counter.lastSequence;
  }
}

export default new OrderNumberRepository();
