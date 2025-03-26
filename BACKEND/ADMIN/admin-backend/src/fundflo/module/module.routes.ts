import express from "express";
import * as moduleController from "./module.controller";

const router = express.Router();

router.get("/", moduleController.getModules);
router.get("/:id", moduleController.getModuleById);

export default router;