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

router.get(
  "/tips",
  authenticate,
  authorize(Role.ADMIN, Role.SERVER),
  validateZodQuery(dateRangeSchema),
  reportsController.getTipsReport.bind(reportsController),
);

router.use(authenticate, authorize(Role.ADMIN));

router.get("/dashboard", reportsController.getDashboardSummary.bind(reportsController));
router.get("/waiter-performance", reportsController.getWaiterPerformanceReport.bind(reportsController));
router.get("/kitchen-performance", reportsController.getKitchenPerformanceReport.bind(reportsController));
router.get(
  "/cancelled-items",
  validateZodQuery(dateRangeSchema),
  reportsController.getCancelledItemAnalytics.bind(reportsController),
);
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

