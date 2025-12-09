// server/src/routes/orderRoutes.js
import { Router } from "express";
import {
  checkout,
  getOrderHistory,
  updateDeliveryStatus,
} from "../controllers/orderController.js";

const router = Router();

router.post("/checkout", checkout);
router.get("/history", getOrderHistory);
router.put("/:order_id/status", updateDeliveryStatus);

export default router;
