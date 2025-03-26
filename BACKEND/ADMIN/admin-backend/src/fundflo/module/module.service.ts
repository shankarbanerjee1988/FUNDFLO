import * as moduleRepo from "./module.repository";
import { NotFoundError } from "../../utils/errors";

export const getModules = async () => {
  return await moduleRepo.getAllModules();
};

export const getModule = async (id: string) => {
  const module = await moduleRepo.getModuleById(id);
  if (!module) throw new NotFoundError();
  return module;
};

export const addModule = async (data: any) => {
  return await moduleRepo.createModule(data);
};

export const editModule = async (id: string, data: any) => {
  return await moduleRepo.updateModule(id, data);
};

export const removeModule = async (id: string) => {
  return await moduleRepo.deleteModule(id);
};