import Module from './module.model';
import { Op } from 'sequelize';

class ModuleRepository {
  async create(data: any) {
    return await Module.create(data);
  }

  async findAll(limit: number, offset: number, search?: string) {
    const whereClause = search
      ? {
          [Op.or]: [
            { module_code: { [Op.iLike]: `%${search}%` } },
            { module_name: { [Op.iLike]: `%${search}%` } }
          ],
        }
      : {};
    
    return await Module.findAndCountAll({ where: whereClause, limit, offset });
  }

  async findById(id: string) {
    return await Module.findByPk(id);
  }

  async update(id: string, data: any) {
    return await Module.update(data, { where: { id } });
  }

  async delete(id: string) {
    return await Module.destroy({ where: { id } });
  }
}

export default new ModuleRepository();
