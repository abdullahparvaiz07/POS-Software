import { Prisma } from "@prisma/client";

class KitchenQueueRepository {
  async createMany(tx: Prisma.TransactionClient, data: Prisma.KitchenQueueCreateManyInput[]) {
    await tx.kitchenQueue.createMany({ data });
  }
}

export default new KitchenQueueRepository();
