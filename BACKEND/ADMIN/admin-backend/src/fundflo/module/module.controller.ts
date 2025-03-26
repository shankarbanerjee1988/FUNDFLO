// controller/module.controller.ts
import { Request, Response } from 'express';
import moduleService from './module.service';

class ModuleController {
    async create(req: Request, res: Response) {
        try {
            const module = await moduleService.createModule(req.body);
            res.status(201).json(module);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const modules = await moduleService.getAllModules(req.query);
            res.status(200).json(modules);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const module = await moduleService.getModuleById(req.params.id);
            if (!module) return res.status(404).json({ message: 'Module not found' });
            res.status(200).json(module);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const updated = await moduleService.updateModule(req.params.id, req.body);
            res.status(200).json({ message: 'Module updated', updated });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await moduleService.deleteModule(req.params.id);
            res.status(200).json({ message: 'Module deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new ModuleController();
