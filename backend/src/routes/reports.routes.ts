import { Role } from "@prisma/client";
import { Router } from "express";
import { reportsController } from "../controllers/reports.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  dateRangeSchema,
  groupBySchema,
  popularItemsSchema,
  validateZodQuery,
} from "../validators/reports.validators";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get("/dashboard", reportsController.getDashboardSummary.bind(reportsController));
router.get("/export/:type", reportsController.exportReport.bind(reportsController));
router.get(
  "/revenue",
  validateZodQuery(groupBySchema),
  reportsController.getRevenueSummary.bind(reportsController),
);
router.get(
  "/orders",
  validateZodQuery(groupBySchema),
  reportsController.getOrderAnalytics.bind(reportsController),
);
router.get(
  "/popular-items",
  validateZodQuery(popularItemsSchema),
  reportsController.getPopularItems.bind(reportsController),
);
router.get(
  "/tables",
  validateZodQuery(dateRangeSchema),
  reportsController.getTableUtilization.bind(reportsController),
);
router.get(
  "/feedback",
  validateZodQuery(dateRangeSchema),
  reportsController.getFeedbackAnalytics.bind(reportsController),
);

export default router;
