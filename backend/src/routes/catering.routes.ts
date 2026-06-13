import { Role } from "@prisma/client";
import { Router } from "express";
import { cateringController } from "../controllers/catering.controller";
import { authenticate, authenticateFeedbackSession } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  cateringLeadIdSchema,
  createCateringLeadSchema,
  listCateringLeadsSchema,
  updateCateringLeadStatusSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/catering.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

router.post(
  "/leads",
  authenticateFeedbackSession,
  validateBody(createCateringLeadSchema),
  cateringController.create.bind(cateringController),
);
router.post(
  "/enquiries",
  authenticateFeedbackSession,
  validateBody(createCateringLeadSchema),
  cateringController.create.bind(cateringController),
);
router.get("/leads/export", adminOnly, cateringController.exportCsv.bind(cateringController));
router.get("/enquiries/export", adminOnly, cateringController.exportCsv.bind(cateringController));
router.get(
  "/leads",
  adminOnly,
  validateQuery(listCateringLeadsSchema),
  cateringController.getAll.bind(cateringController),
);
router.get(
  "/enquiries",
  adminOnly,
  validateQuery(listCateringLeadsSchema),
  cateringController.getAll.bind(cateringController),
);
router.get(
  "/leads/:id",
  adminOnly,
  validateParams(cateringLeadIdSchema),
  cateringController.getOne.bind(cateringController),
);
router.get(
  "/enquiries/:id",
  adminOnly,
  validateParams(cateringLeadIdSchema),
  cateringController.getOne.bind(cateringController),
);
router.patch(
  "/leads/:id/status",
  adminOnly,
  validateParams(cateringLeadIdSchema),
  validateBody(updateCateringLeadStatusSchema),
  cateringController.updateStatus.bind(cateringController),
);
router.patch(
  "/enquiries/:id/status",
  adminOnly,
  validateParams(cateringLeadIdSchema),
  validateBody(updateCateringLeadStatusSchema),
  cateringController.updateStatus.bind(cateringController),
);

export default router;
