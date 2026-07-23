import { Request, Response, NextFunction } from "express";
import modifierService from "./modifier.service";
import { ApiQueryOptions } from "../../shared/types/query.types";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await modifierService.create(req.body);
    res.status(201).json({ status: "success", data: group });
  } catch (err) {
    next(err);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryOptions = req.query as unknown as ApiQueryOptions;
    const result = await modifierService.findAll(queryOptions);
    res.json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await modifierService.findById(Number(req.params.id));
    res.json({ status: "success", data: group });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await modifierService.update(Number(req.params.id), req.body);
    res.json({ status: "success", data: group });
  } catch (err) {
    next(err);
  }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await modifierService.delete(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
