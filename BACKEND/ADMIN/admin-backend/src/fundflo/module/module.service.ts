import ModuleRepository from './module.repository';

class ModuleService {
  async createModule(data: any) {
    return await ModuleRepository.create(data);
  }

  async getModules(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    return await ModuleRepository.findAll(limit, offset, search);
  }

  async getModuleById(id: string) {
    return await ModuleRepository.findById(id);
  }

  async updateModule(id: string, data: any) {
    return await ModuleRepository.update(id, data);
  }

  async deleteModule(id: string) {
    return await ModuleRepository.delete(id);
  }
}

export default new ModuleService();