import Module from "./module.model";

export const getAllModules = async () => {
  return await Module.findAll();
};

export const getModuleById = async (id: string) => {
  return await Module.findByPk(id);
};

export const createModule = async (data: any) => {
  return await Module.create(data);
};

export const updateModule = async (id: string, data: any) => {
  return await Module.update(data, { where: { id } });
};

export const deleteModule = async (id: string) => {
  return await Module.destroy({ where: { id } });
};