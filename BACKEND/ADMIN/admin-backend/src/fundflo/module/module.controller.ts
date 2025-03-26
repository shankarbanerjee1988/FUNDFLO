import { Request, Response } from 'express';
import ModuleService from './module.service';

class ModuleController {
  async create(req: Request, res: Response) {
    try {
      const module = await ModuleService.createModule(req.body);
      res.status(201).json({ success: true, message: 'Module created successfully', data: module });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const modules = await ModuleService.getModules(Number(page), Number(limit), search as string);
      res.json({ success: true, message: 'Modules retrieved successfully', data: modules.rows, total: modules.count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const module = await ModuleService.getModuleById(req.params.id);
      if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
      res.json({ success: true, message: 'Module retrieved successfully', data: module });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updated = await ModuleService.updateModule(req.params.id, req.body);
      if (!updated[0]) return res.status(404).json({ success: false, message: 'Module not updated' });
      res.json({ success: true, message: 'Module updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await ModuleService.deleteModule(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Module not found' });
      res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ModuleController();