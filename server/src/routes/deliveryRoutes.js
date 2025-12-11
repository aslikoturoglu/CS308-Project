import { Router } from "express";
import { 
  getDeliveries,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  hasUserReceivedProduct
} from "../controllers/deliveryController.js";

const router = Router();

/* ============================================================
   USER → Bu ürünü teslim aldı mı? (Yorum izni)
   (En spesifik olan → EN ÜSTE)
============================================================ */
router.get("/user/:userId/product/:productId/hasDelivered", hasUserReceivedProduct);

/* ============================================================
   USER → Belirli order'ın teslimat bilgisi
   (GENEL route → ADMIN listeden önce gelmeli)
============================================================ */
router.get("/:orderId", getDeliveryByOrderId);

/* ============================================================
   ADMIN → Tüm teslimatlar
   (En geniş route → EN ALTA)
============================================================ */
router.get("/", getDeliveries);

/* ============================================================
   ADMIN → Teslimat durumunu güncelle
============================================================ */
router.put("/:id", updateDeliveryStatus);

export default router;
