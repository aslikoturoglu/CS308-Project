// server/src/routes/orderRoutes.js
import { Router } from "express";
import {
  checkout,
  getOrdersByUser,
  getOrderItems,
} from "../controllers/orderController.js";

const router = Router();

/* =============================
   USER ORDER ENDPOINTS
============================= */

// Kullanıcının tüm siparişleri
router.get("/user/:userId", getOrdersByUser);

// Sipariş içindeki ürünleri getir
router.get("/:orderId/items", getOrderItems);

/* =============================
   ORDER PROCESS
============================= */

// Checkout
router.post("/checkout", checkout);

export default router;
