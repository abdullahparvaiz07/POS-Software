import { Request, Response } from "express";
import { userService } from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.validation";
import { sendResponse } from "../../utils/sendResponse";

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const roleId = req.query.roleId ? parseInt(req.query.roleId as string) : undefined;
      const status = req.query.status as 'ACTIVE' | 'INACTIVE';

      const result = await userService.getAllUsers({ page, limit, search, roleId, status });
      
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Users retrieved successfully",
        data: result.users,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Failed to retrieve users",
        meta: { errors: [{ message: error.message }] }
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const user = await userService.getUserById(id);
      
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: user
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: error.message,
      });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const actorId = req.user?.id || 1; // From auth middleware
      
      const user = await userService.createUser(validatedData as any, actorId);
      
      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User created successfully",
        data: user
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: error.message || "Validation failed",
        meta: { errors: error.errors }
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const validatedData = updateUserSchema.parse(req.body);
      const actorId = req.user?.id || 1;
      
      const user = await userService.updateUser(id, validatedData as any, actorId);
      
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User updated successfully",
        data: user
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: error.message || "Validation failed",
        meta: { errors: error.errors }
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const actorId = req.user?.id || 1;
      
      const user = await userService.deleteUser(id, actorId);
      
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully",
        data: user
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: error.message,
      });
    }
  }

  async restoreUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const actorId = req.user?.id || 1;
      
      const user = await userService.restoreUser(id, actorId);
      
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User restored successfully",
        data: user
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: error.message,
      });
    }
  }
}

export const userController = new UserController();
