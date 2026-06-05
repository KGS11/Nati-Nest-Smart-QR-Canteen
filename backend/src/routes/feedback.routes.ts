import { Role } from "@prisma/client";
import { Router } from "express";
import { feedbackController } from "../controllers/feedback.controller";
import { authenticate, authenticateFeedbackSession } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  getFeedbackQuerySchema,
  submitFeedbackSchema,
  validateZodQuery,
  validateZodSchema,
} from "../validators/feedback.validators";

const router = Router();

router.post(
  "/",
  authenticateFeedbackSession,
  validateZodSchema(submitFeedbackSchema),
  feedbackController.submitFeedback.bind(feedbackController),
);
router.get(
  "/status",
  authenticateFeedbackSession,
  feedbackController.getFeedbackStatus.bind(feedbackController),
);
router.get(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validateZodQuery(getFeedbackQuerySchema),
  feedbackController.getAllFeedback.bind(feedbackController),
);

export default router;
