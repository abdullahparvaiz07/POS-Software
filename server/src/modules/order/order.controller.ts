import { Request, Response, NextFunction } from "express";
import orderService from "./order.service";
import { sendResponse } from "../../utils/sendResponse";
import { ORDER_MESSAGES } from "./order.constants";
import { parseId } from "../../utils/parseId";

class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.body, req.user!.id);
      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: ORDER_MESSAGES.CREATED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getOrders(req.query);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.FETCHED,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.getOrderById(id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.FETCHED_ONE,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.updateStatus(id, req.body.status, req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.STATUS_UPDATED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.assignStaffToOrder(id, req.body, req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.STAFF_ASSIGNED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEligibleStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const role = (req.query.role as string)?.toUpperCase() === 'RIDER' ? 'RIDER' : 'WAITER';
      const staff = await orderService.getEligibleStaffByRole(role);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Eligible staff retrieved successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.markPaid(id, req.body.paymentMethod, req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.PAYMENT_COMPLETED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.cancelOrder(id, req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.CANCELLED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const order = await orderService.completeOrder(id, req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: ORDER_MESSAGES.COMPLETED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
