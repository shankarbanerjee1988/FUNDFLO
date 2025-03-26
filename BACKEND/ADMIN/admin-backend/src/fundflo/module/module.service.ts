// service/module.service.ts
import moduleRepository from './module.repository';
import Module from './module.model';

class ModuleService {
    async createModule(moduleData: Partial<Module>) {
        return await moduleRepository.create(moduleData);
    }

    async getAllModules(queryParams: any) {
        return await moduleRepository.findAll(queryParams);
    }

    async getModuleById(id: string) {
        return await moduleRepository.findById(id);
    }

    async updateModule(id: string, moduleData: Partial<Module>) {
        return await moduleRepository.update(id, moduleData);
    }

    async deleteModule(id: string) {
        return await moduleRepository.delete(id);
    }
}

export default new ModuleService();