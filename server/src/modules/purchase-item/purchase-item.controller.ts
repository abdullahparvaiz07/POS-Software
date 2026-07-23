import { Request, Response, NextFunction } from "express";
import purchaseItemService from "./purchase-item.service";
import { sendResponse } from "../../utils/sendResponse";
import { PURCHASE_ITEM_MESSAGES } from "./purchase-item.constants";
import { parseId } from "../../utils/parseId";

class PurchaseItemController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseId = parseId(req.params.purchaseId);
      const item = await purchaseItemService.createPurchaseItem(purchaseId, req.body);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: PURCHASE_ITEM_MESSAGES.CREATED,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseId = parseId(req.params.purchaseId);
      const items = await purchaseItemService.getPurchaseItems(purchaseId);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_ITEM_MESSAGES.FETCHED,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseId = parseId(req.params.purchaseId);
      const itemId = parseId(req.params.itemId);
      const item = await purchaseItemService.getPurchaseItemById(purchaseId, itemId);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_ITEM_MESSAGES.FETCHED_ONE,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseId = parseId(req.params.purchaseId);
      const itemId = parseId(req.params.itemId);
      const item = await purchaseItemService.updatePurchaseItem(purchaseId, itemId, req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_ITEM_MESSAGES.UPDATED,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseId = parseId(req.params.purchaseId);
      const itemId = parseId(req.params.itemId);
      await purchaseItemService.deletePurchaseItem(purchaseId, itemId);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: PURCHASE_ITEM_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseItemController();
