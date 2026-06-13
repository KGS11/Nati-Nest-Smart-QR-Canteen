import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authenticateSession } from "../middlewares/authenticate";
import { createOrderValidator, orderIdParamValidator } from "../validators/order.validators";

const router = Router();

router.use(authenticateSession);

router.post("/", createOrderValidator, orderController.create.bind(orderController));
router.get("/", orderController.getSessionOrders.bind(orderController));
router.get("/:orderId", orderIdParamValidator, orderController.getDetails.bind(orderController));
router.patch("/:orderId/cancel", orderIdParamValidator, orderController.cancel.bind(orderController));

export default router;
