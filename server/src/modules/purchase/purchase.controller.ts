import { Request, Response, NextFunction } from "express";
import purchaseService from "./purchase.service";
import { sendResponse } from "../../utils/sendResponse";
import { PURCHASE_MESSAGES } from "./purchase.constants";
import { parseId } from "../../utils/parseId";

class PurchaseController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const purchase = await purchaseService.createPurchase(req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: PURCHASE_MESSAGES.CREATED,
        data: purchase,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseService.getPurchases(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_MESSAGES.FETCHED,
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
      const purchase = await purchaseService.getPurchaseById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_MESSAGES.FETCHED_ONE,
        data: purchase,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const purchase = await purchaseService.updatePurchase(id, req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_MESSAGES.UPDATED,
        data: purchase,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await purchaseService.deletePurchase(id, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const purchase = await purchaseService.receivePurchase(id, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_MESSAGES.RECEIVED_SUCCESS,
        data: purchase,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseController();
