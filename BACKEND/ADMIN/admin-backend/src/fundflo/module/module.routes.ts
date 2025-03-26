import { Router } from "express";
import ModuleController from './module.controller';

const router = Router();

router.post("/", ModuleController.create);
router.get("/list", ModuleController.getAll);
// router.get("/:id",ModuleController.getById);
// router.put("/:id", moduleController.update.bind(moduleController));
// router.delete("/:id", moduleController.delete.bind(moduleController));

export default router;