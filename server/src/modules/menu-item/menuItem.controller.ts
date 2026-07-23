import { Request, Response, NextFunction } from "express";
import menuItemService from "./menuItem.service";
import { sendResponse } from "../../utils/sendResponse";
import { MENU_ITEM_MESSAGES } from "./menuItem.constants";
import { parseId } from "../../utils/parseId";

class MenuItemController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const menuItem = await menuItemService.createMenuItem(req.body, req.user!);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: MENU_ITEM_MESSAGES.CREATED,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await menuItemService.getAllMenuItems(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: MENU_ITEM_MESSAGES.FETCHED,
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
      const menuItem = await menuItemService.getMenuItemById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: MENU_ITEM_MESSAGES.FETCHED_ONE,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const menuItem = await menuItemService.updateMenuItem(id, req.body, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: MENU_ITEM_MESSAGES.UPDATED,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await menuItemService.deleteMenuItem(id, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: MENU_ITEM_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const menuItem = await menuItemService.restoreMenuItem(id, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Menu item restored successfully.",
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MenuItemController();
