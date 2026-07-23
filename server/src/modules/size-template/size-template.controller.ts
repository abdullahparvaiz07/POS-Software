import { Request, Response, NextFunction } from "express";
import sizeTemplateService from "./size-template.service";
import { ApiQueryOptions } from "../../shared/types/query.types";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await sizeTemplateService.create(req.body);
    res.status(201).json({ status: "success", data: template });
  } catch (err) {
    next(err);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryOptions = req.query as unknown as ApiQueryOptions;
    const result = await sizeTemplateService.findAll(queryOptions);
    res.json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await sizeTemplateService.findById(Number(req.params.id));
    res.json({ status: "success", data: template });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await sizeTemplateService.update(Number(req.params.id), req.body);
    res.json({ status: "success", data: template });
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sizeTemplateService.delete(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
