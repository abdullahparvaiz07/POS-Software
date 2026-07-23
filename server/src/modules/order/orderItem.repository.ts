import { Prisma } from "@prisma/client";

class OrderItemRepository {
  async createMany(tx: Prisma.TransactionClient, data: Prisma.OrderItemCreateManyInput[]) {
    await tx.orderItem.createMany({ data });
  }

  async findByOrderId(tx: Prisma.TransactionClient, orderId: number) {
    // This allows the service to retrieve the auto-generated Item IDs inside the same transaction
    // before inserting into the Kitchen and Bar queues.
    return tx.orderItem.findMany({
      where: { orderId }
    });
  }
}

export default new OrderItemRepository();
