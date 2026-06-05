import { Role } from "@prisma/client";
import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate";
import {
  createCategorySchema,
  updateCategorySchema,
  validate,
} from "../validators/menu.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

router.post("/", adminOnly, validate(createCategorySchema), categoryController.create.bind(categoryController));
router.get("/", optionalAuthenticate, categoryController.getAll.bind(categoryController));
router.put("/:id", adminOnly, validate(updateCategorySchema), categoryController.update.bind(categoryController));
router.delete("/:id", adminOnly, categoryController.delete.bind(categoryController));

export default router;
