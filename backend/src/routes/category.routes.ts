import { Role } from "@prisma/client";
import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate";
import { validateUUID } from "../middlewares/validateUUID";
import {
  createCategorySchema,
  updateCategorySchema,
  validate,
} from "../validators/menu.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

router.post("/", adminOnly, validate(createCategorySchema), categoryController.create.bind(categoryController));
router.get("/", optionalAuthenticate, categoryController.getAll.bind(categoryController));
router.put("/:id", adminOnly, validateUUID("id"), validate(updateCategorySchema), categoryController.update.bind(categoryController));
router.delete("/:id", adminOnly, validateUUID("id"), categoryController.delete.bind(categoryController));

export default router;
