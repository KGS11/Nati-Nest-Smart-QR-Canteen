import { Role } from "@prisma/client";
import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate, authenticateSession } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { verifyPaymentValidator, setTipValidator } from "../validators/order.validators";

const router = Router();

router.post(
  "/request-bill",
  authenticateSession,
  paymentController.requestBill.bind(paymentController),
);
router.post(
  "/tip",
  authenticateSession,
  setTipValidator,
  paymentController.setTip.bind(paymentController),
);
router.get("/status", authenticateSession, paymentController.getPaymentStatus.bind(paymentController));
router.get(
  "/pending",
  authenticate,
  authorize(Role.SERVER, Role.ADMIN),
  paymentController.getPendingPayments.bind(paymentController),
);
router.patch(
  "/:paymentId/verify",
  authenticate,
  authorize(Role.SERVER, Role.ADMIN),
  verifyPaymentValidator,
  paymentController.verifyPayment.bind(paymentController),
);

export default router;
