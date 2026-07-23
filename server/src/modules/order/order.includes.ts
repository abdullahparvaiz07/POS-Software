import { Prisma } from "@prisma/client";

export const ORDER_DETAILS_INCLUDE = {
  assignedStaff: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    }
  },
  waiter: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    }
  },
  deliveryRider: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    }
  },
  assignedBy: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    }
  },
  createdByUser: {
    select: {
      id: true,
      fullName: true
    }
  },
  orderItems: {
    include: {
      kitchenQueue: true,
      barQueue: true
    }
  }
} satisfies Prisma.OrderInclude;
