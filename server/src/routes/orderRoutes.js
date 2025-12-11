// server/src/routes/orderRoutes.js
import { Router } from "express";
import {
  checkout,
  getAllOrders,
  getOrderHistory,
  updateDeliveryStatus,
} from "../controllers/orderController.js";

import { generateInvoice, emailInvoice } from "../controllers/invoiceController.js";

const router = Router();

router.post("/checkout", checkout);
router.get("/", getAllOrders);
router.get("/history", getOrderHistory);
router.put("/:order_id/status", updateDeliveryStatus);

router.get("/:order_id/invoice", generateInvoice);
router.post("/:order_id/invoice/email", emailInvoice);

export default router;
