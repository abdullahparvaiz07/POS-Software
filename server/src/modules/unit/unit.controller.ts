import { Request, Response, NextFunction } from "express";
import unitService from "./unit.service";
import { sendResponse } from "../../utils/sendResponse";
import { UNIT_MESSAGES } from "./unit.constants";
import { parseId } from "../../utils/parseId";

class UnitController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await unitService.createUnit(req.body);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: UNIT_MESSAGES.CREATED,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitService.getUnits(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: UNIT_MESSAGES.FETCHED,
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
      const unit = await unitService.getUnitById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: UNIT_MESSAGES.FETCHED_ONE,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const unit = await unitService.updateUnit(id, req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: UNIT_MESSAGES.UPDATED,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await unitService.deleteUnit(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: UNIT_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UnitController();
