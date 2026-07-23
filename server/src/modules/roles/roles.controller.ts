import { Request, Response, NextFunction } from 'express';
import roleService from './roles.service';

export class RoleController {
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.getRoleById(Number(req.params.id));
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoleController();
