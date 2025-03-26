// repository/module.repository.ts
import { Op } from 'sequelize';
import Module from './module.model';

class ModuleRepository {
    async create(moduleData: Partial<Module>) {
        return await Module.create(moduleData);
    }

    async findAll({ page = 1, size = 10, search = '', filter = {}, orderBy = 'updated_date', order = 'DESC', groupBy }: any) {
        const offset = (page - 1) * size;
        const whereCondition: any = {};

        if (search) {
            whereCondition.module_name = { [Op.iLike]: `%${search}%` };
        }

        Object.assign(whereCondition, filter);

        const options: any = {
            where: whereCondition,
            limit: size,
            offset,
            order: [[orderBy, order]],
        };

        if (groupBy) {
            options.group = [groupBy];
        }

        return await Module.findAndCountAll(options);
    }

    async findById(id: string) {
        return await Module.findByPk(id);
    }

    async update(id: string, moduleData: Partial<Module>) {
        return await Module.update(moduleData, { where: { id } });
    }

    async delete(id: string) {
        return await Module.destroy({ where: { id } });
    }
}

export default new ModuleRepository();