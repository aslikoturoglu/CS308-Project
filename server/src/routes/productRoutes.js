// server/src/routes/productRoutes.js
import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../controllers/productController.js";

const router = Router();

// Tüm ürünleri getir
router.get("/", getAllProducts);

// Tek ürün getir
router.get("/:id", getProductById);

// Yeni ürün ekle
router.post("/", addProduct);

// Ürün güncelle
router.put("/:id", updateProduct);

// Ürün sil
router.delete("/:id", deleteProduct);

// Stok artır / azalt
router.put("/:id/stock", updateProductStock);

export default router;
