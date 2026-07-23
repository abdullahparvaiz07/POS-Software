import { Request, Response, NextFunction } from "express";
import supplierService from "./supplier.service";
import { sendResponse } from "../../utils/sendResponse";
import { SUPPLIER_MESSAGES } from "./supplier.constants";
import { parseId } from "../../utils/parseId";

class SupplierController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.createSupplier(req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: SUPPLIER_MESSAGES.CREATED,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierService.getSuppliers(req.query);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: SUPPLIER_MESSAGES.FETCHED,
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
      const supplier = await supplierService.getSupplierById(id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: SUPPLIER_MESSAGES.FETCHED_ONE,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      const supplier = await supplierService.updateSupplier(id, req.body, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: SUPPLIER_MESSAGES.UPDATED,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);
      await supplierService.deleteSupplier(id, req.user!.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: SUPPLIER_MESSAGES.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();
