// server/src/routes/orderRoutes.js
import { Router } from "express";
import {
  checkout,
  getOrderHistory,
  updateDeliveryStatus,
} from "../controllers/orderController.js";

import { generateInvoice } from "../controllers/invoiceController.js";

const router = Router();

router.post("/checkout", checkout);
router.get("/history", getOrderHistory);
router.put("/:order_id/status", updateDeliveryStatus);

router.get("/:order_id/invoice", generateInvoice);

export default router;
