import { Request, Response, NextFunction } from "express";
import * as moduleService from "./module.service";

export const getModules = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const modules = await moduleService.getModules();
    res.json(modules);
  } catch (error) {
    next(error);
  }
};

export const getModuleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const module = await moduleService.getModule(req.params.id);
    res.json(module);
  } catch (error) {
    next(error);
  }
};