// routes/module.routes.ts
import { Router } from 'express';
import ModuleController from './module.controller';

const router = Router();

router.post('/modules', ModuleController.create);
router.get('/modules', ModuleController.getAll);
router.put('/modules/:id', ModuleController.update);
router.delete('/modules/:id', ModuleController.delete);

export default router;