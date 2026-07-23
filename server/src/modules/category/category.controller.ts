import { Request, Response, NextFunction } from "express";
import categoryService from "./category.service";
import { sendResponse } from "../../utils/sendResponse";
import { CATEGORY_MESSAGES } from "./category.constants";
import { parseId } from "../../utils/parseId";

class CategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.createCategory(req.body, req.user!);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: CATEGORY_MESSAGES.CREATED,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.getAllCategories(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: CATEGORY_MESSAGES.FETCHED,
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
      const category = await categoryService.getCategoryById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: CATEGORY_MESSAGES.FETCHED_ONE,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const category = await categoryService.updateCategory(id, req.body, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: CATEGORY_MESSAGES.UPDATED,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await categoryService.deleteCategory(id, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: CATEGORY_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const category = await categoryService.restoreCategory(id, req.user!);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: CATEGORY_MESSAGES.RESTORED,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
