import { Prisma } from "@prisma/client";

class BarQueueRepository {
  async createMany(tx: Prisma.TransactionClient, data: Prisma.BarQueueCreateManyInput[]) {
    await tx.barQueue.createMany({ data });
  }
}

export default new BarQueueRepository();
