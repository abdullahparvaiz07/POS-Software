import { Request, Response, NextFunction } from "express";
import ingredientService from "./ingredient.service";
import { sendResponse } from "../../utils/sendResponse";
import { INGREDIENT_MESSAGES } from "./ingredient.constants";
import { parseId } from "../../utils/parseId";

class IngredientController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ingredient = await ingredientService.createIngredient(req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: INGREDIENT_MESSAGES.CREATED,
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ingredientService.getIngredients(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: INGREDIENT_MESSAGES.FETCHED,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async findLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await ingredientService.getLowStock(page as string, limit as string);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: INGREDIENT_MESSAGES.FETCHED,
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
      const ingredient = await ingredientService.getIngredientById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: INGREDIENT_MESSAGES.FETCHED_ONE,
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const ingredient = await ingredientService.updateIngredient(id, req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: INGREDIENT_MESSAGES.UPDATED,
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await ingredientService.deleteIngredient(id, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: INGREDIENT_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IngredientController();
